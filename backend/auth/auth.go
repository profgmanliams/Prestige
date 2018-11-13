package auth

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/sharat87/prestige/dbclient"
	"github.com/sharat87/prestige/exchange"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/utils"
	"log"
	"net/http"
	"strings"
)

type RecaptchaResponse struct {
	Name  string `json:"name"`
	Event struct {
		Token           string `json:"token"`
		SiteKey         string `json:"siteKey"`
		UserAgent       string `json:"userAgent"`
		UserIpAddress   string `json:"userIpAddress"`
		ExpectedAction  string `json:"expectedAction"`
		HashedAccountId string `json:"hashedAccountId"`
	} `json:"event"`
	Score           float32 `json:"score"`
	TokenProperties struct {
		Valid         bool   `json:"valid"`
		InvalidReason string `json:"invalidReason"`
		Hostname      string `json:"hostname"`
		Action        string `json:"action"`
		CreateTime    string `json:"createTime"`
	} `json:"tokenProperties"`
}

func HandleRegister(ctx context.Context, ex *exchange.Exchange) {
	if ex.RequireMethod(http.MethodPost) != nil {
		return
	}
	ex.InitSession(ctx)

	// TODO: Validate email address.
	registerDTO := struct {
		Email          string
		Password       string
		RecaptchaToken string
	}{}

	err := ex.DecodeBody(&registerDTO)
	if err != nil {
		log.Printf("Error decoding register payload: %v", err)
		ex.RespondErrorDeprecated(http.StatusBadRequest, err)
		return
	}

	if len(registerDTO.Email) < 3 {
		ex.RespondErrorDeprecated(http.StatusBadRequest, errors.New("email too small, min 3 characters"))
		return
	}

	if len(registerDTO.Email) > 150 {
		ex.RespondErrorDeprecated(http.StatusBadRequest, errors.New("email too long, max 150 characters"))
		return
	}

	if len(registerDTO.Password) < 4 {
		ex.RespondErrorDeprecated(http.StatusBadRequest, errors.New("password too small, min 4 characters"))
		return
	}

	if len(registerDTO.Password) > 150 {
		ex.RespondErrorDeprecated(http.StatusBadRequest, errors.New("password too long, max 150 characters"))
		return
	}

	if ex.RecaptchaConfig != nil {
		if len(registerDTO.RecaptchaToken) < 4 {
			ex.RespondErrorDeprecated(http.StatusBadRequest, errors.New("recaptchaToken too small, min 4 characters"))
			return
		}

		if len(registerDTO.RecaptchaToken) > 2000 {
			// This is usually 1500-1600 characters in length.
			ex.RespondErrorDeprecated(http.StatusBadRequest, errors.New("recaptchaToken too long, max 2000 characters"))
			return
		}

		response, err := ex.HTTPDo(httpclient.Request{
			Method: http.MethodPost,
			URL:    "https://recaptchaenterprise.googleapis.com/v1beta1/projects/" + ex.RecaptchaConfig.ProjectId + "/assessments?key=" + ex.RecaptchaConfig.ApiKey,
			Body: map[string]any{
				"event": map[string]any{
					"token":          registerDTO.RecaptchaToken,
					"siteKey":        ex.RecaptchaConfig.SiteKey,
					"expectedAction": "SIGNUP",
				},
			},
		})
		if err != nil {
			log.Printf("Error doing recaptcha verification request: %v %v", err, response)
			ex.RespondErrorDeprecated(http.StatusUnauthorized, err)
			return
		}

		data := RecaptchaResponse{}
		err = json.Unmarshal(response.Body, &data)
		if err != nil {
			log.Printf("Error unmarshalling response body from recaptcha verification request: %v %v", err, string(response.Body))
			ex.RespondErrorDeprecated(http.StatusUnauthorized, errors.New("recaptcha verification failed"))
			return
		}

		if !data.TokenProperties.Valid || data.TokenProperties.Action != "SIGNUP" {
