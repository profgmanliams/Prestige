package csrf

// Theory is that if we don't accept any payloads that browser forms send, then we don't have the CSRF attack surface area.

import (
	"bytes"
	"github.com/sharat87/prestige/apitests/tastysession"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/utils"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
