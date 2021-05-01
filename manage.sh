#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail
if [[ -n "${CI-}" ]]; then
	set -o xtrace
fi

-h() { help; }
help() {
	echo 'Please see the manage.sh script source for available tasks.' >&2
}

# TODO: Hitting Ctrl-c in middle of a job doesn't cancel.

###
# Backend targets
###

serve-backend() {
	cd backend
	go run .
}

build-backend() (
	cd backend
	go build \
		-o ../prestige \
		-v \
		-ldflags "-X main.Version=${VERSION-} -X main.Date=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
		.
)

lint-backend() {
	cd backend
	go vet ./...
}

test-backend() {
	pushd backend

	docker compose pull
	docker compose up -d

	# The `%%` here will be replaced by a different db name for each test.
	export PRESTIGE_DATABASE_URI="mongodb://user:pass@localhost/%%?authSource=admin"

