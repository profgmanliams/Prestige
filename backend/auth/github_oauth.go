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

