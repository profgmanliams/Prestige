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
