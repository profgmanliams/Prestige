package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/sharat87/prestige/dbclient"
	"github.com/sharat87/prestige/exchange"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/utils"
	"go.mongodb.org/mongo-driver/bson"
	"log"
	"net/http"
)

type GitHubErrorResponse struct {
	Message          string `json:"message"`
	DocumentationUrl string `json:"documentation_url"`
}

// OAuthVerifyResponse Sample: {"access_token":"gho_sample_token", "scope":"repo,gist", "token_type":"bearer"}
type OAuthVerifyResponse struct {
	AccessToken string `json:"access_token"`
	Scope       string `json:"scope"`
	TokenType   string `json:"token_type"`
}

type UserDetailsResponse struct {
	Data struct {
		Viewer struct {
			DatabaseId uint   `json:"databaseId"`
			Id         string `json:"id"`
			Login      string `json:"login"`
			AvatarUrl  string `json:"avatarURL"`
			Email      string `json:"email"`
		} `json:"viewer"`
	} `json:"data"`
}

type UserEmailsResponse struct {
	IsVerified bool   `json:"verified"`
	Email      string `json:"email"`
	IsPrimary  bool   `json:"primary"`
}

func HandleGithubAuth(ctx context.Context, ex *exchange.Exchange) {
	if ex.RequireMethod(http.MethodGet) != nil {
		return
	}
	session := ex.InitSession(ctx)

	if ex.GitHubClient == nil {
		ex.RespondErrorDeprecated(http.StatusInternalServerError, errors.New("Github integration not available"))
		return
	}

	stateToken, err := utils.GenerateRandomString()
	if err != nil {
		log.Printf("Error generating random string for github auth state: %v", err)
		ex.RespondErrorDeprecated(http.StatusInternalServerError, err)
		return
	}

	ex.SaveSessionGithubAuthState(ctx, stateToken) // Do in separate thread?
	log.Printf("state token: %v", session)

	authUrl := "https://github.com/login/oauth/authorize?client_id=" + ex.GitHubClient.Id + "&scope=read:user user:email gist&state=" + stateToken
	http.Redirect(ex.ResponseWriter, &ex.Request, authUrl, http.StatusTemporaryRedirect)
}

func HandleGithubAuthCallback(ctx context.Context, ex *exchange.Exchange) {
	if ex.RequireMethod(http.MethodGet) != nil {
		return
	}
	session := ex.InitSession(ctx)

	if ex.GitHubClient == nil {
		ex.RespondErrorDeprecated(http.StatusInternalServerError, errors.New("Github integration not available"))
		return
	}

	queryParams := ex.Request.URL.Query()

	errorParam := queryParams.Get("error")
	if errorParam == "access_denied" {
		// The user clicked on "Cancel" instead of "Authorize".
		// ?error=access_denied&error_description=The+user+has+denied+your+application+access.&error_uri=https%3A%2F%2Fdocs.github.com%2Fapps%2Fmanaging-oauth-apps%2Ftroubleshooting-authorization-request-errors%2F%23access-denied
		jsMessageResponse(ex, errorParam)
		return
	}

	if errorParam != "" {
		ex.RespondErrorDeprecated(http.StatusUnauthorized, errors.New(errorParam))
		return
	}

	stateParam := queryParams.Get("state")
	if stateParam == "" || stateParam != session.GithubAuthState {
		ex.RespondErrorDeprecated(http.StatusUnauthorized, errors.New(fmt.Sprintf("state mismatch, expected %q, got %q", session.GithubAuthState, stateParam)))
		return
	}

	ex.SaveSessionGithubAuthState(ctx, "")

	codeParam := queryParams.Get("code")
	if codeParam == "" {
		ex.RespondErrorDeprecated(http.StatusInternalServerError, errors.New("missing OAuth2 code"))
		return
	}

	response, err := ex.HTTPDo(httpclient.Request{
		Method: http.MethodPost,
		URL:    "https://github.com/login/oauth/access_token?client_id=" + ex.GitHubClient.Id + "&client_secret=" + ex.GitHubClient.Secret + "&code=" + codeParam,
		Headers: map[string]string{
			"Accept": "application/json",
		},
	})
	if err != nil {
		if response != nil {
			log.Printf("Error response from Github oauth verification request: %v %s", response, response.Body)
			ex.RespondErrorDeprecated(http.StatusUnauthorized, errors.New("Github oauth verification failed"))
		} else {
			log.Printf("Error doing Github oauth verification request: %v", err)
			ex.RespondErrorDeprecated(http.StatusInternalServerError, err)
		}
		return
	}

	oAuthVerifyResponse := OAuthVerifyResponse{}
	err = json.Unmarshal(response.Body, &oAuthVerifyResponse)
	if err != nil {
		log.Printf("Error unmarshalling response body from access token request: %v %v", err, string(response.Body))
		ex.RespondErrorDeprecated(http.StatusUnauthorized, errors.New("access token failed"))
		return
	}

	if oAuthVerifyResponse.AccessToken == "" {
		// Example:  {"error":"incorrect_client_credentials","error_description":"The client_id and/or client_secret passed are incorrect.","error_uri":"https://docs.github.com/apps/managing-oauth-apps/troubleshooting-oauth-app-access-token-request-errors/#incorrect-client-credentials"}
		type ErrorResponse struct {
			Error            string `json:"error"`
			ErrorDescription string `json:"error_description"`
			ErrorUri         string `json:"error_uri"`
		}
		errorResponse := ErrorResponse{}
		err = json.Unmarshal(response.Body, &errorResponse)
		if err != nil {
			log.Printf("Error unmarshalling error response body from access token request: %v %v", err, string(response.Body))
			ex.RespondErrorDeprecated(http.StatusUnauthorized, errors.New("access token failed"))
			return
		}
		log.Printf("Error getting access token %v", errorResponse)
		ex.RespondErrorDeprecated(http.StatusInternalServerError, errors.New(errorResponse.Error))
		return
	}

	response, err = ex.HTTPDo(httpclient.Request{
		Method: http.MethodPost,
		URL:    "https://api.github.com/graphql",
		Body: map[string]any{
			"query": `
				{
				  viewer {
					databaseId
					id
