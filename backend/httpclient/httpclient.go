package httpclient

import (
	"bytes"
	"fmt"
	"github.com/sharat87/prestige/utils"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

type Request struct {
	Method  string
	URL     string
	Headers map[string]string
	Body    any
}

type Response struct {
	StatusCode int
	Body       []byte
}

type HTTPClient interface {
	Do(request Request) (*Response, error)
}

type Impl struct {
	NativeClient *http.Client
}

