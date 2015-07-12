package proxy

import (
	"github.com/google/go-cmp/cmp"
	"github.com/sharat87/prestige/utils"
	"testing"
)

func TestHeadersToTuples(t *testing.T) {
	got := headersToTuples(map[string][]string{
		"header-one": {"value-one"},
		"header-two": {"value-two"},
		"empty-one":  {""},
	})

	utils.SortHeaderTuples(got)

	want := [][]string{
		{"Empty-One", ""},
