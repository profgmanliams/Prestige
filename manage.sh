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

	n=4
	while [[ $n -gt 0 ]]; do
		if docker compose exec mongo mongosh "${PRESTIGE_DATABASE_URI//%%/}" --quiet --eval "$(cat apitests/mongodb-test-data.js)"; then
			break
		fi
		sleep 3
		n=$((n - 1))
	done

	go clean -testcache || true
	code=0
	if ! go mod tidy; then
		code=1
	elif ! go test -vet=all -cover ./... | color-go-test-output; then
		code=1
	fi

	popd

	return $code
}

color-go-test-output() {
	sed -e "/^ok /s/^/$(printf "\033[32m")/" -e "/FAIL/s/^/$(printf "\033[31m")/" -e "s/$/$(printf "\033[0m")/"
}

###
# Frontend targets
###

serve-frontend() {
	cd frontend
	if [[ package.json -nt yarn.lock ]]; then
		yarn install
	fi
	fix-star-zoom
	NODE_ENV=development exec npx parcel serve src/index.html --dist-dir dist-serve --port "${PORT-3040}"
}

build-frontend() (
	cd frontend
	fix-star-zoom
	NODE_ENV=production npx parcel build src/index.html --dist-dir dist --no-autoinstall --no-cache
	cp -v src/assets/logo-32.png dist/favicon.png
)

fix-star-zoom() {
	if grep -F -m1 -q "*zoom:" node_modules/tachyons/css/tachyons.css; then
		out="$(sed "s/\*zoom:/zoom:/" node_modules/tachyons/css/tachyons.css)"
		echo "$out" >node_modules/tachyons/css/tachyons.css
	fi
}

lint-frontend() {
	ensure-node_modules frontend
	(
		cd frontend
		npx tsc --noEmit --project .
		npx eslint --report-unused-disable-directives src
	)
}

test-frontend() (
	ensure-node_modules frontend
	cd frontend
	npx jest
)

###
# Documentation
###

serve-docs() {
	ensure-hugo
	cd docs
	./hugo server --port 3042
}

build-docs() (
	ensure-hugo
	cd docs
	./hugo
)

ensure-hugo() {
	if [[ ! -e docs/hugo ]]; then
		if [[ $(uname) == Darwin ]]; then
			url="https://github.com/gohugoio/hugo/releases/download/v0.101.0/hugo_extended_0.101.0_macOS-64bit.tar.gz"
		else
			url="https://github.com/gohugoio/hugo/releases/download/v0.101.0/hugo_extended_0.101.0_Linux-64bit.tar.gz"
		fi
		pushd docs
		curl -sL "$url" | tar -xz
		popd
	fi
}

###
# UI Tests
###

test-ui() {
	build-all
	cd ui-tests
	if [[ package.json -nt yarn.lock ]]; then
		if [[ -n ${CI-} ]]; then
			echo 'Yarn lock file is older than package.json, failing CI.' >&2
			exit 1
		else
			yarn install
		fi
	elif [[ -n ${CI-} ]]; then
		yarn install --frozen-lockfile
	fi

	yarn playwright install --with-deps

	cp -v ../prestige .

	docker compose -f ../backend/docker-compose.yaml pull
	docker compose -f ../backend/docker-compose.yaml up -d

	n=4
	while [[ $n -gt 0 ]]; do
		if docker compose -f ../backend/docker-compose.yaml exec mongo mongosh "mongodb://user:pass@localhost/ui-tests?authSource=admin" --quiet --eval "$(cat ../backend/apitests/mongodb-test-data.js)"; then
			break
		fi
		sleep 3
		n=$((n - 1))
	done

	DEBUG=pw:webserver yarn playwright test
}

###
# Miscellaneous / Project-wide targets
###

build-all() (
	build-frontend
	rm -rf backend/assets/static
	mv frontend/dist backend/assets/static
	build-docs
	mv docs/public backend/assets/static/docs
