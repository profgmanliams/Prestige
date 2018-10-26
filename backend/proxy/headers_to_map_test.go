package proxy

import (
	"github.com/google/go-cmp/cmp"
	"testing"
)

func TestHeadersToMap(t *testing.T) {
	got := headersToMap([][]string{
		{"header-one", "value-one"},
		{"header-two", "value-two"},
		{"empty-one", ""},
	})

	want := map[string][]string{
