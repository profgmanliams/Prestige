package proxy

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"github.com/sharat87/prestige/cookies"
	"github.com/sharat87/prestige/exchange"
	"github.com/sharat87/prestige/utils"
	"io"
	"io/ioutil"
	"log"
	"mime/multipart"
	"net"
	"net/http"
	"net/textproto"
	"strings"
	"time"
)

type (
	Job struct {
		Id       string
		Method   string
		URL      string
		Headers  [][]string // List of two-tuples of header name and value.
		Cookies  map[string]map[string]map[string]cookies.CookieValue
		Body     string
		BodyType string `json:"bodyType"`
		Timeout  int
	}

	Response struct {
		Id       string                                               `json:"id"`
		Response *RealisedResponse                                    `json:"response"`
		History  []*RealisedResponse                                  `json:"history"`
		Cookies  map[string]map[string]map[string]cookies.CookieValue `json:"cookies"`
		Error    *Error                                               `json:"error,omitempty"`
	}

	RealisedResponse struct {
		URL        string          `json:"url"`
		StatusCode int             `json:"status"`
		StatusText string          `json:"statusText"`
		Headers    [][]string      `json:"headers"`
		Body       string          `json:"body"`
		Request    RealisedRequest `json:"request"`
	}

	RealisedRequest struct {
		Method  string     `json:"method"`
		Headers [][]string `json:"headers"`
		Body    string     `json:"body"`
	}

	Error struct {
		Message string `json:"message"`
	}
)

func HandleProxy(_ context.Context, ex *exchange.Exchange) {
	if ex.Request.Method == http.MethodGet {
		http.Redirect(ex.ResponseWriter, &ex.Request, "./docs/guides/proxy/", http.StatusMovedPermanently)
		return
	} else if ex.Request.Method != http.MethodPost {
		ex.RespondError(
			http.StatusBadRequest,
			"invalid-method-for-proxy",
			"Invalid method for proxy",
		)
		return
	}

	job := Job{}
	err := ex.DecodeBody(&job)
	if err != nil {
		log.Printf("Error decoding proxy payload: %v", err)
		ex.RespondError(
			http.StatusBadRequest,
			"error-decoding-proxy-payload",
			"Error decoding proxy payload",
		)
		return
	}

	jar, err := cookies.NewExportableCookieJar(job.Cookies)
	if err != nil {
		log.Printf("Error creating cookie jar: %v", err)
		ex.RespondError(
			http.StatusInternalServerError,
			"error-creating-cookie-jar-in-proxy",
			"Error creating cookie jar",
		)
		return
	}

	var history []*RealisedResponse

	client := &http.Client{
		Transport: makeTransport(ex),
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) > 9 {
				log.Println("Too many redirects, ending")
				return http.ErrUseLastResponse
			}
			history = append(history, RealiseResponse(req.Response))
			return nil
		},
		Jar:     jar,
		Timeout: 10 * time.Second,
	}

	overrideContentType := ""
	var requestBody io.Reader

	if job.BodyType == "multipart/form-data" {
		body := utils.ParseJson([]byte(job.Body))
		var b bytes.Buffer
		w := multipart.NewWriter(&b)

		for key, value := range body {
			if value == nil {
				value = "null"
			}
			// TODO: Change the data structure so it's friendly to static typing here.
			if valueDict, ok := value.(map[string]any); ok {
				formFile, err := CreateFormFile(w, key, valueDict["name"].(string), valueDict["type"].(string))
				if err != nil {
					log.Printf("Error creating form file: %v", err)
					return
				}
				decodedFileBody, err := base64.StdEncoding.DecodeString(valueDict["body"].(string))
				if err != nil {
					log.Printf("Error decoding file body: %v", err)
					ex.RespondError(http.StatusBadRequest, "error-decoding-file-body", "Error decoding file body")
					return
				}
				_, err = formFile.Write(decodedFileBody)
				if err != nil {
					log.Printf("Error writing file body: %v", err)
					return
				}
			} else if valueStr, ok := value.(string); ok {
				err := w.WriteField(key, valueStr)
				if err != nil {
					log.Printf("Error writing field: %v", err)
					return
				}
			} else {
				log.Printf("Error: unsupported value type for field %s: %T :: %#v", key, value, value)
			}
		}

		err := w.Close()
		if err != nil {
			log.Printf("Error closing multipart writer: %v", err)
			return
		}

		requestBody = &b
		overrideContentType = w.FormDataContentType()

	} else {
		requestBody = bytes.NewReader([]byte(job.Body))

	}

	jobRequest, err := http.NewRequest(job.Method, job.URL, requestBody)
	if err != nil {
		log.Printf("Error creating request: %v", err)
		ex.RespondError(
			http.StatusInternalServerError,
			"error-creating-request-from-job",
