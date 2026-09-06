# BookIT browser tests

Requires Docker, Make, Node and the repository's pnpm dependencies. Install the
browser once with `pnpm exec playwright install chromium`.

From the repository root:

```sh
make -C e2e run-e2e                 # Build and test the current checkout
make -C e2e run-e2e VERSION='<sha>' # Test published commit images
make -C e2e run-e2e VERSION=v1.2.0  # Test a release or any other published tag
```

`pnpm test:e2e` runs the same Make target. For private GHCR images, first use
`docker login ghcr.io` with read-only package access.

To test specific digests instead of a shared tag:

```sh
make -C e2e run-e2e \
  BOOKIT_FRONTEND_IMAGE='ghcr.io/cthit/bookit-node-frontend@sha256:<digest>' \
  BOOKIT_BACKEND_IMAGE='ghcr.io/cthit/bookit-node-backend@sha256:<digest>'
```

Every run uses fresh Testcontainers-managed containers, volumes and a network:
BookIT frontend/backend, Gamma, and separate PostgreSQL/Redis instances for each
app. The backend image initializes the empty BookIT database before startup.
Requests go through the backend to the Nginx frontend, as in production.
No development servers or existing databases are used.

Tests log in through Gamma with member/admin/outsider fixtures and reset bookings
and rules between tests. Completion or failure removes the owned containers,
volumes and network; Testcontainers' reaper handles interrupted runs. Locally built
image tags are removed on exit. Build caches and unrelated Docker resources are
left alone. Published images are pulled on every run.

Failures retain Playwright traces, screenshots, video and service logs.
CI publishes commit images after quality checks and runs this same target with
`VERSION`. Fork/Dependabot PRs get quality checks only, without registry credentials;
image E2E requires a reviewed branch in this repository. GitHub releases retag
the tested commit images without rebuilding.

Service versions are pinned in `compose.ts`. BookIT's PostgreSQL 12 and Redis 5
upgrades remain separate follow-ups.
