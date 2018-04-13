package main

import (
	"context"
	"github.com/sharat87/prestige/config"
	"github.com/sharat87/prestige/dbclient"
	"github.com/sharat87/prestige/httpclient"
	"github.com/sharat87/prestige/mux"
	"log"
	"net"
	"net/http"
	"os"
	"runtime/debug"
	"time"
)

var ( // Values injected at build time.
	Version   string
	BuildTime string
)

func main() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile | log.LUTC | log.Lmsgprefix)

	logMetaInformation()
	cfg := config.MustLoad()

	listener, err := net.Listen("tcp", cfg.BindTarget)
	if err != nil {
		log.Panicf("Error creating listener: %v", err)
	}

	m := mux.New()
	defer func(m *mux.Mux) {
		err := m.Close()
		if err != nil {
			log.Println("Error closing mux:", err)
		}
	}(m)

	if uri := os.Getenv("PRESTIGE_DATABASE_URI"); uri != "" {
		m.UseDBClient(dbclient.New(context.TODO(), uri))
	}

	m.UseConfig(cfg)

	m.UseHTTPClient(httpclient.New())

	// TODO: Prefix all environment variables with `PRESTIGE_`.
	if os.Getenv("RECAPTCHA_PROJECT_ID") != "" {
		log.Print("Recaptcha enabled")
		m.UseRecaptcha(
			os.Getenv("RECAPTCHA_PROJECT_ID"),
			os.Getenv("RECAPTCHA_SITE_KEY"),
