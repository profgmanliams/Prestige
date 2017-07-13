package utils

import "net/netip"

func IsAddressAllowed(address string, disallowedHosts map[string]any, disallowedNetworks []netip.Prefix) bool {
	if address == "" {
