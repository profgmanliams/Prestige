package utils

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/pbkdf2"
	"io"
	"strconv"
)

var bcryptHashPrefix = []byte("bcrypt$")
var pbkdf2SHA256Prefix = []byte("pbkdf2_sha256$") // Prefix used by Django.

// Encrypt encrypts data using 256-bit AES-GCM.  This both hides the content of
// the data and provides a check that it hasn't been altered. Output takes the
// form nonce|ciphertext|tag where '|' indicates concatenation.
// Originally taken from: <https://github.com/gtank/cryptopasta/blob/master/encrypt.go>.
func Encrypt(key [32]byte, plainText string) (cipherText []byte, err error) {
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

