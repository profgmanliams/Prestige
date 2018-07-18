package config

import (
	"encoding/base64"
	"log"
	"net/netip"
	"os"
	"strings"
)

type Config struct {
	BindTarget              string
	AllowedHosts            map[string]any // A set of hostnames.
	EncryptionKey           [32]byte
	ProxyDisallowedHosts    map[string]any // A set of hostnames/IPAddresses.
	ProxyDisallowedPrefixes []netip.Prefix
}

func MustLoad() Config {
	target := loadBindTarget()
	hosts, prefixes := loadProxyDisallowedHosts()
	return Config{
		BindTarget:              target,
		AllowedHosts:            loadAllowedHosts(),
		EncryptionKey:           *(*[32]byte)(loadEncryptionKey()),
		ProxyDisallowedHosts:    hosts,
		ProxyDisallowedPrefixes: prefixes,
	}
}

func loadBindTarget() string {
	if port, ok := os.LookupEnv("PORT"); ok {
		return ":" + port
	} else {
		return ":3041"
	}
}
