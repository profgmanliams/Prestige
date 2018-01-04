package cookies

import (
	"golang.org/x/net/publicsuffix"
	"net/http"
	"net/http/cookiejar"
	"net/url"
	"sync"
	"time"
)

type CookieValue struct {
	Value   string     `json:"value"`
	Expires *time.Time `json:"expires"`
	Secure  bool       `json:"secure"`
}

func NewExportableCookieJar(plain map[string]map[string]map[string]CookieValue) (*ExportableCookieJar, error) {
	realJar, err := cookiejar.New(&cookiejar.Options{PublicSuffixList: publicsuffix.List})
	if err != nil {
		return nil, err
	}

	jar := &ExportableCookieJar{jar: realJar}

	for domain, byDomain := range plain {
		for path, byPath := range byDomain {
			var cookies []*http.Cookie
			for name, value := range byPath {
				var expires time.Time
				if value.Expires != nil {
					expires = *value.Expires
				}
				cookies = append(cookies, &http.Cookie{
					Name:    name,
					Value:   value.Value,
					Expires: expires,
