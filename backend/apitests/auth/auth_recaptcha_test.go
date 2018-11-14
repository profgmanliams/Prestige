package auth

import (
	"github.com/sharat87/prestige/apitests/tastysession"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/utils"
	"net/http"
	"testing"
)

type MockHTTPClient struct {
	do    func(req httpclient.Request) (*httpclient.Response, error)
	calls []httpclient.Request
}

func (m *MockHTTPClient) Do(req httpclient.Request) (*httpclient.Response, error) {
	m.calls = append(m.calls, req)
	return m.do(req)
}

func TestRegisterWithValidRecaptcha(t *testing.T) {
	ts := tastysession.New(t)
	ts.Mux.UseRecaptcha("rpi", "rsk", "rak")

	httpClient := &MockHTTPClient{
		do: func(req httpclient.Request) (*httpclient.Response, error) {
			return &httpclient.Response{
				StatusCode: http.StatusOK,
				Body: utils.ToJson(map[string]any{
