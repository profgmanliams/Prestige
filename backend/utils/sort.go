package utils

import "sort"

func SortHeaderTuples(tuples [][]string) {
	sort.Slice(tuples, func(i, j int) bool {
		if tuples[i][0] == tuples[j][0] {
