package auth_test

import (
	"github.com/sharat87/prestige/apitests/tastysession"
	"github.com/sharat87/prestige/httpclient"
	"net/http"
	"testing"
)

func TestLoginForUserWithGithub(t *testing.T) {
	email := t.Name() + "@example.com"
	ts := tastysession.New(t)

	ts.Do(httpclient.Request{
		Method: http.MethodPost,
		URL:    "/auth/login",
		Body: map[string]any{
			"email":          email,
			"password":       "dummy-pass",
			"recaptchaToken": "",
		},
