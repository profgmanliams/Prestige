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

