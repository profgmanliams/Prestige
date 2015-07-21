package proxy

import (
	"github.com/sharat87/prestige/apitests/tastysession"
	"github.com/sharat87/prestige/httpclient"
	"net/http"
	"testing"
)

func TestRedirect(t *testing.T) {
	ts := tastysession.New(t)

	ts.Do(httpclient.Request{
		Method: http.MethodPost,
		URL:    "/proxy",
		Body: map[string]any{
			"url":      "http://localhost:3043/redirect/1",
			"method":   "POST",
			"headers":  []any{},
			"timeout":  300,
			"bodyType": "raw",
			"body":     "",
		},
