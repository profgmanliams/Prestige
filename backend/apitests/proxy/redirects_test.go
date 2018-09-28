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
	})
	ts.AssertStatusCode(http.StatusOK)

	ts.Nil(ts.LastResponseBody["cookies"], "cookies")

	ts.Equal(1, len(ts.LastResponseBody["history"].([]any)), "history length")
	historyItem := ts.LastResponseBody["history"].([]any)[0].(map[string]any)
	ts.Equal("http://localhost:3043/redirect/1", historyItem["url"], "history item url")

	ts.Equal(
		"../get",
