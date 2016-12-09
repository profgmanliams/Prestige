package utils

import "net/netip"

func IsAddressAllowed(address string, disallowedHosts map[string]any, disallowedNetworks []netip.Prefix) bool {
	if address == "" {
		return false
	}

	if _, ok := disallowedHosts[address]; ok {
		return false
	}

