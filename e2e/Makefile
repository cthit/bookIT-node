export VERSION ?=
export BOOKIT_FRONTEND_IMAGE ?=
export BOOKIT_BACKEND_IMAGE ?=

.PHONY: run-e2e
run-e2e:
	@set -eu; \
	local_frontend=""; local_backend=""; \
	cleanup() { \
		if [ -n "$$local_frontend" ]; then docker image rm "$$local_frontend" || true; fi; \
		if [ -n "$$local_backend" ]; then docker image rm "$$local_backend" || true; fi; \
	}; \
	trap cleanup EXIT; trap 'exit 130' INT; trap 'exit 143' TERM; \
	if [ -n "$$VERSION" ]; then \
		if [ -n "$$BOOKIT_FRONTEND_IMAGE$$BOOKIT_BACKEND_IMAGE" ]; then \
			echo "Use VERSION or explicit image references, not both" >&2; exit 1; \
		fi; \
		BOOKIT_FRONTEND_IMAGE="ghcr.io/cthit/bookit-node-frontend:$$VERSION"; \
		BOOKIT_BACKEND_IMAGE="ghcr.io/cthit/bookit-node-backend:$$VERSION"; \
	fi; \
	if [ -n "$$BOOKIT_FRONTEND_IMAGE$$BOOKIT_BACKEND_IMAGE" ]; then \
		: "$${BOOKIT_FRONTEND_IMAGE:?Both image references are required}"; \
		: "$${BOOKIT_BACKEND_IMAGE:?Both image references are required}"; \
		docker pull --platform linux/amd64 "$$BOOKIT_FRONTEND_IMAGE"; \
		docker pull --platform linux/amd64 "$$BOOKIT_BACKEND_IMAGE"; \
	elif [ -n "$${CI:-}" ]; then \
		echo "CI requires VERSION or explicit image references" >&2; exit 1; \
	else \
		local_frontend="bookit-e2e-frontend:run-$$$$"; \
		local_backend="bookit-e2e-backend:run-$$$$"; \
		docker build --pull --platform linux/amd64 -f ../frontend/Dockerfile -t "$$local_frontend" ..; \
		docker build --pull --platform linux/amd64 -f ../backend/Dockerfile -t "$$local_backend" ..; \
		BOOKIT_FRONTEND_IMAGE="$$local_frontend"; BOOKIT_BACKEND_IMAGE="$$local_backend"; \
	fi; \
	export BOOKIT_FRONTEND_IMAGE BOOKIT_BACKEND_IMAGE; \
	pnpm --dir .. exec playwright test
