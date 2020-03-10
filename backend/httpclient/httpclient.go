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
