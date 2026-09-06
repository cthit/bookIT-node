# BookIT browser tests

Requires Docker, Make, Node and the repository's pnpm dependencies. Install the
browser once with `pnpm exec playwright install chromium`.

From the repository root:

```sh
make -C e2e run-e2e                 # Build and test the current checkout
make -C e2e run-e2e VERSION='<sha>' # Test a published commit image
make -C e2e run-e2e VERSION=v1.2.0  # Test a release or any other published tag
```

`pnpm test:e2e` runs the same Make target. For private GHCR images, first use
`docker login ghcr.io` with read-only package access.

To test a specific image digest:

```sh
make -C e2e run-e2e \
  BOOKIT_IMAGE='ghcr.io/cthit/bookit@sha256:<digest>'
```

Every run uses fresh Testcontainers-managed containers, volumes and a network:
BookIT, Gamma, and separate PostgreSQL/Redis instances for each app.
The BookIT image initializes the empty database before startup, then serves both
the API and built frontend, as in production.
No development servers or existing databases are used.

Tests log in through Gamma with member/admin/outsider fixtures and reset bookings
and rules between tests. Test data is created through the UI, and assertions check
what users see; tests do not call the API directly.
Completion or failure removes the owned containers,
volumes and network; Testcontainers' reaper handles interrupted runs. Locally built
image tags are removed on exit. Build caches and unrelated Docker resources are
left alone. Published images are pulled on every run.

Failures retain Playwright traces, screenshots, video and service logs.
CI publishes a commit image after quality checks and runs this same target with
`VERSION`. Fork/Dependabot PRs get quality checks only, without registry credentials;
image E2E requires a reviewed branch in this repository. GitHub releases retag
the tested commit image without rebuilding.

Development and E2E share `gamma/users.json`. Development uses a stable SQL-seeded
OAuth client; E2E provisions a fresh client through Gamma's UI because each run
uses different ports and credentials.

Service versions are pinned in `compose.ts`. BookIT's PostgreSQL 12 and Redis 5
upgrades remain separate follow-ups.

Manual verification with the pinned Gamma 2.5.1 image found that BookIT's OIDC
sign-out redirect reaches a Gamma HTTP 500 page. Gamma's own Logout button works;
use it before switching test users. The automated suite uses isolated browser
contexts and does not cover this sign-out flow. Resolve and retest the provider's
OIDC logout support before treating local sign-out as verified.

The existing Prisma schema also gives rules a fixed February 2022 default for
`created_at` and `updated_at`. Newly created rules consequently show that date in
their details. Correcting those database defaults and defining update-time
behavior requires a separate migration; this change leaves the schema intact.
