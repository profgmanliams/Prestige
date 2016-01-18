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
	}

	if gistResponse.Data.Viewer.Gists.TotalCount == 0 {
		ex.RespondError(http.StatusNotFound, "no-gists-found-api", "No gists found")
		return
	}

	owner := gistResponse.Data.Viewer.Login

	var gists []Gist

	for _, gist := range gistResponse.Data.Viewer.Gists.Nodes {
		var files []FileItem
		firstMarkdownFile := ""

		for _, file := range gist.Files {
			if file.IsImage {
				continue
			}
			if firstMarkdownFile == "" && file.Language.Name == "Markdown" {
				firstMarkdownFile = file.Name
				continue
			}
			if strings.HasSuffix(file.Name, ".prestige") {
				files = append(files, FileItem{Name: file.Name})
			}
		}

		if len(files) == 0 {
			// No *.prestige files found, so skip this gist.
			continue
		}

		gists = append(gists, Gist{
			ID:          gist.ID,
			Name:        gist.Name,
			Owner:       owner,
			Description: gist.Description,
			Readme:      FileItem{Name: firstMarkdownFile},
			Files:       files,
		})
	}

	ex.Respond(http.StatusOK, map[string]any{"gists": gists})
}

func HandleCreate(_ context.Context, ex *exchange.Exchange, user *dbclient.User, accessToken string) {
	createGistDTO := struct {
		Title       string
		Description string
		Content     string
		IsPublic    bool `json:"isPublic"`
	}{}

	err := ex.DecodeBody(&createGistDTO)
	if err != nil {
		log.Printf("Error decoding register payload: %v", err)
		ex.RespondError(http.StatusBadRequest, "json-decode-error-in-gist-create-api", err.Error())
		return
	}

	if createGistDTO.Title == "" {
		ex.RespondError(http.StatusBadRequest, "missing-title-in-gist-create-api", "Missing title when creating gist")
		return
	}

	createGistDTO.Title = strings.TrimSpace(createGistDTO.Title)
	createGistDTO.Description = strings.TrimSpace(createGistDTO.Description)

	if createGistDTO.Content == "" {
		createGistDTO.Content = InitialGistContent
	}

	readmeName := "_" + createGistDTO.Title + ".md"

	// Ref: <https://docs.github.com/en/rest/reference/gists#create-a-gist>.
	createResponse, err := ex.HTTPDo(httpclient.Request{
		Method: http.MethodPost,
		URL:    "https://api.github.com/gists",
		Headers: map[string]string{
			"Accept":        "application/vnd.github.v3+json",
			"Authorization": "Bearer " + accessToken,
		},
		Body: map[string]any{
			"description": createGistDTO.Description,
			"public":      createGistDTO.IsPublic,
			"files": map[string]any{
				readmeName: map[string]any{
					"content": "# " + createGistDTO.Title,
				},
				"main.prestige": map[string]any{
					"content": createGistDTO.Content,
				},
			},
		},
	})
	if err != nil {
		if createResponse == nil {
			log.Printf("Error from create gist API: %+v", err)
		}
		ex.RespondError(http.StatusInternalServerError, "error-creating-gist-api", "Error creating gist")
		return
	}

	type CreateGistResponse struct {
		ID string `json:"id"`
	}

	createGistResponse := CreateGistResponse{}
	err = json.Unmarshal(createResponse.Body, &createGistResponse)
	if err != nil {
		log.Printf("Error parsing create gist response: %+v; %v", err, string(createResponse.Body))
		ex.RespondError(http.StatusInternalServerError, "error-parsing-create-gist-response-api", "Error parsing create gist response")
		return
	}

	gistId := createGistResponse.ID
	readmeContent := assets.RenderGistReadme(map[string]any{
		"title":          createGistDTO.Title,
		"githubUsername": user.Github.Username,
		"gistId":         gistId,
	})

	updateResponse, err := ex.HTTPDo(httpclient.Request{
		Method: http.MethodPost,
		URL:    "https://api.github.com/gists/" + gistId,
		Headers: map[string]string{
			"Accept":        "application/vnd.github.v3+json",
			"Authorization": "Bearer " + accessToken,
		},
		Body: map[string]any{
			"files": map[string]any{
				readmeName: map[string]any{
					"content": "# " + readmeContent,
				},
				"main.prestige": map[string]any{
					"content": createGistDTO.Content,
				},
			},
		},
	})
	if err != nil {
		if updateResponse == nil {
			log.Printf("Error from update gist API when setting Readme content: %+v", err)
		}
		ex.RespondError(http.StatusInternalServerError, "error-updating-gist-api", "Error updating gist")
		return
