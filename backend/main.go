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

