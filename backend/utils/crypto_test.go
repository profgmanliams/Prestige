package utils

import (
	"testing"
)

func TestEncryptAndDecrypt(t *testing.T) {
	key := *(*[32]byte)([]byte("a secret with exactly `32` bytes"))

