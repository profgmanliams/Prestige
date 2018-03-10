package auth

import (
	"github.com/sharat87/prestige/apitests/tastysession"
	"github.com/sharat87/prestige/httpclient"
	"net/http"
	"testing"
)

func TestAuthHappy(t *testing.T) {
	email := t.Name() + "@example.com"
	ts := tastysession.New(t)

	// Register
	ts.Do(httpclient.Request{
		Method: http.MethodPost,
		URL:    "/auth/register",
		Body: map[string]any{
			"email":          email,
			"password":       "dummy-pass",
			"recaptchaToken": "",
		},
	})
	ts.AssertStatusCode(http.StatusCreated)
	ts.AssertResponse(map[string]any{
		"user": map[string]any{
			"email":             email,
			"isGitHubConnected": false,
		},
	})

	// Profile
	ts.Do(httpclient.Request{
		Method: http.MethodGet,
		URL:    "/auth/profile",
	})
	ts.AssertStatusCode(http.StatusOK)
	ts.AssertResponse(map[string]any{
		"user": map[string]any{
			"email":             email,
			"isGitHubConnected": false,
		},
	})

