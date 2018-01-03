package tastysession

import (
	"bytes"
	"context"
	"github.com/google/go-cmp/cmp"
	"github.com/sharat87/prestige/config"
	"github.com/sharat87/prestige/dbclient"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/mux"
	"github.com/sharat87/prestige/utils"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

type TastySession struct {
	T                *testing.T
	Mux              mux.Mux
	LastResponse     *http.Response
	LastResponseBody map[string]any
}

func (ts *TastySession) Do(r httpclient.Request) {
	request := httptest.NewRequest(r.Method, "http://localhost"+r.URL, bytes.NewReader(utils.ToJson(r.Body)))

	if ts.LastResponse != nil {
		for _, cookie := range ts.LastResponse.Cookies() {
			request.AddCookie(cookie)
		}
	}

	for name, value := range r.Headers {
		request.Header.Set(name, value)
	}

	if request.Method != http.MethodGet {
		request.Header.Set("Content-Type", "application/json")
	}

	w := httptest.NewRecorder()
	ts.Mux.ServeHTTP(w, request)

	ts.LastResponse = w.Result()
	responseBody, _ := io.ReadAll(ts.LastResponse.Body)

	ts.T.Logf("Parsing response: << %s >>", string(responseBody))
	ts.LastResponseBody = utils.ParseJson(responseBody)
}

func (ts *TastySession) AssertStatusCode(code int) {
	if ts.LastResponse.StatusCode != code {
		ts.T.Errorf("Expected status code %d, got %d", code, ts.LastResponse.StatusCode)
	}
}

func (ts *TastySession) AssertResponse(want map[string]any) {
	if diff := cmp.Diff(want, ts.LastResponseBody); diff != "" {
		ts.T.Errorf("Got: %#v\nDiff (-want +got):\n%s", ts.LastResponseBody, diff)
