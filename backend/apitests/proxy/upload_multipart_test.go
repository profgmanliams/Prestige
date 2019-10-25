package proxy

import (
	"github.com/sharat87/prestige/apitests/tastysession"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/utils"
	"net/http"
	"testing"
)

func TestMultipartFormField(t *testing.T) {
	ts := tastysession.New(t)

	ts.Do(httpclient.Request{
		Method: http.MethodPost,
		URL:    "/proxy",
		Body: map[string]any{
			"url":    "http://localhost:3043/post",
			"method": "POST",
			"headers": [][]string{
				{"content-type", "multipart/form-data"},
			},
			"timeout":  300,
			"bodyType": "multipart/form-data",
			"body":     `{"name":"Sherlock"}`,
		},
	})
	ts.AssertStatusCode(http.StatusOK)

