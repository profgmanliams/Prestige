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
