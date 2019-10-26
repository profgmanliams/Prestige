package mux

import (
	"context"
	"github.com/sharat87/prestige/assets"
	"github.com/sharat87/prestige/auth"
	"github.com/sharat87/prestige/config"
	"github.com/sharat87/prestige/dbclient"
	"github.com/sharat87/prestige/exchange"
	"github.com/sharat87/prestige/gist"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/proxy"
	"go.mongodb.org/mongo-driver/mongo"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"
)

type Mux struct {
	Routes          []Route
	Config          config.Config
	HTTPClient      httpclient.HTTPClient
	DBClient        dbclient.DBClient
	mongoClient     *mongo.Client
	RecaptchaConfig *exchange.RecaptchaConfig
	GitHubClient    *exchange.GitHubClient
}

type Route struct {
	Pattern regexp.Regexp
	Fn      HandlerFn
}

type HandlerFn func(ctx context.Context, ex *exchange.Exchange)

func New() *Mux {
	m := &Mux{}

	m.Route(`/env`, HandleEnv)

	m.Route(`/proxy`, proxy.HandleProxy)

	m.Route(`/auth/signup`, auth.HandleRegister) // Deprecated.
	m.Route(`/auth/register`, auth.HandleRegister)
	m.Route(`/auth/login`, auth.HandleLogin)
	m.Route(`/auth/logout`, auth.HandleLogout)
	m.Route(`/auth/profile`, auth.HandleProfile)
