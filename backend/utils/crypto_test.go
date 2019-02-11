package utils

import (
	"testing"
)

func TestEncryptAndDecrypt(t *testing.T) {
	key := *(*[32]byte)([]byte("a secret with exactly `32` bytes"))

	originalText := "hello world!"
	cipherText, _ := Encrypt(key, originalText)
	plainText, _ := Decrypt(key, cipherText)

	if plainText != originalText {
		t.Errorf("want %q, but got %q", originalText, plainText)
	}
}

