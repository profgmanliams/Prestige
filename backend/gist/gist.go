package gist

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/sharat87/prestige/assets"
	"github.com/sharat87/prestige/dbclient"
	"github.com/sharat87/prestige/exchange"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/utils"
	"log"
	"net/http"
	"strings"
)

type Gist struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Owner       string     `json:"owner"`
	Description string     `json:"description"`
	Readme      FileItem   `json:"readme"`
	Files       []FileItem `json:"files"`
}

type FileItem struct {
	Name string `json:"name"`
}

var InitialGistContent = assets.GetAssetString("initial.prestige")

const GetListQuery = `{
  viewer {
    login
    gists(first: 100, privacy: ALL) {
      totalCount
      nodes {
        id
        name
        url
        description
        files {
          name
          isImage
          language {
            name
          }
        }
      }
    }
  }
}`

type GetListResponse struct {
	Data struct {
		Viewer struct {
			Login string
			Gists struct {
				TotalCount int
				Nodes      []struct {
					ID          string
					Name        string
					URL         string
					Description string
					Files       []struct {
						Name     string
						IsImage  bool
						Language struct {
							Name string
						}
					}
				}
			}
		}
	}
}

func HandleGistIndex(ctx context.Context, ex *exchange.Exchange) {
	session := ex.InitSession(ctx)
	if session == nil || session.Email == "" {
		ex.RespondErrorDeprecated(http.StatusUnauthorized, errors.New("unauthorized"))
		return
	}

	user, err := ex.DBClient.FindUserByEmail(ctx, session.Email)
	if err != nil {
		log.Printf("Error finding user with email from session: %+v %+v", session, err)
		ex.RespondError(
			http.StatusUnauthorized,
			"error-finding-user-in-gist-index-api",
			"Cannot fetch gists since Github Identity not available for current user.",
		)
		return
	}

	if user.Github.AccessToken == nil {
		log.Printf("User with email %q has no Github details", user.Email)
		ex.RespondError(
			http.StatusUnauthorized,
			"github-identity-unavailable-in-gist-index-api",
			"Cannot fetch gists since Github Identity not available for current user.",
		)
		return
	}

	accessToken, err := utils.Decrypt(ex.Config.EncryptionKey, user.Github.AccessToken)
	if err != nil {
		log.Printf("Error decrypting Github access token: %+v", err)
		ex.RespondError(
			http.StatusUnauthorized,
			"error-decrypting-github-access-token-in-gist-index-api",
			"Cannot fetch gists since Github Identity not available for current user.",
		)
		return
	}

	if ex.Request.Method == http.MethodGet {
		HandleList(ctx, ex, accessToken)
	} else if ex.Request.Method == http.MethodPost {
		HandleCreate(ctx, ex, user, accessToken)
	} else {
		ex.RespondError(http.StatusMethodNotAllowed, "bad-request-gist-index-api", "Method not allowed")
	}
}

func HandleList(_ context.Context, ex *exchange.Exchange, accessToken string) {
	response, err := ex.HTTPDo(httpclient.Request{
		Method: http.MethodPost,
		URL:    "https://api.github.com/graphql",
		Headers: map[string]string{
			"Accept":        "application/vnd.github.v3+json",
			"Authorization": "Bearer " + accessToken,
		},
		Body: map[string]any{
			"query": GetListQuery,
		},
	})
	if err != nil {
		log.Printf("Error fetching gists: %+v", err)
		ex.RespondError(http.StatusInternalServerError, "error-fetching-gists-api", "Error fetching gists")
		return
	}

	gistResponse := GetListResponse{}
	err = json.Unmarshal(response.Body, &gistResponse)
	if err != nil {
		log.Printf("Error parsing gists list response: %+v; %v", err, string(response.Body))
