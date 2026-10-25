export VERSION ?=
export BOOKIT_IMAGE ?=

.PHONY: run-e2e
run-e2e:
	@set -eu; \
	local_image=""; \
	cleanup() { \
		if [ -n "$$local_image" ]; then docker image rm "$$local_image" || true; fi; \
	}; \
	trap cleanup EXIT; trap 'exit 130' INT; trap 'exit 143' TERM; \
	if [ -n "$$VERSION" ]; then \
		if [ -n "$$BOOKIT_IMAGE" ]; then \
			echo "Use VERSION or BOOKIT_IMAGE, not both" >&2; exit 1; \
		fi; \
		BOOKIT_IMAGE="ghcr.io/cthit/bookit:$$VERSION"; \
	fi; \
	if [ -n "$$BOOKIT_IMAGE" ]; then \
		docker image inspect "$$BOOKIT_IMAGE" >/dev/null 2>&1 || \
			docker pull --platform linux/amd64 "$$BOOKIT_IMAGE"; \
	elif [ -n "$${CI:-}" ]; then \
		echo "CI requires VERSION or BOOKIT_IMAGE" >&2; exit 1; \
	else \
		local_image="bookit-e2e:run-$$$$"; \
		docker build --pull --platform linux/amd64 -f ../Dockerfile -t "$$local_image" ..; \
		BOOKIT_IMAGE="$$local_image"; \
	fi; \
	export BOOKIT_IMAGE; \
	pnpm --dir .. exec playwright test
