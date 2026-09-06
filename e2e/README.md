# BookIT browser tests

The suite exercises the real BookIT backend and frontend against a real Gamma
identity provider. `compose.ts` owns the complete environment: an isolated Docker
network, two PostgreSQL containers, two Redis containers, Gamma, Prisma schema
initialization, and either application processes or published application containers. Ports are assigned per run. It
does not read another checkout or use a developer's database or credentials.

Install dependencies and Playwright Chromium, then use `pnpm test:e2e`. Docker
must be running. A worker shares the container environment, while each test gets
a fresh browser context and cleared BookIT bookings/rules. Run with one worker
to keep the suite's resource usage predictable.

## Development servers or published images

Local runs default to development servers (`E2E_MODE=dev`).
CI requires `E2E_MODE=images` and refuses to fall back to
development servers if either image is missing.

To run the same suite locally against specific published candidates:

```sh
# For private packages, authenticate Docker with read:packages access first.
docker login ghcr.io
E2E_MODE=images \
BOOKIT_FRONTEND_IMAGE='ghcr.io/cthit/bookit-node-frontend@sha256:<frontend-digest>' \
BOOKIT_BACKEND_IMAGE='ghcr.io/cthit/bookit-node-backend@sha256:<backend-digest>' \
pnpm test:e2e
```

Replace each placeholder with its 64-character digest from the CI candidate job
outputs/logs. Tags such as `latest` are rejected. Docker/Testcontainers use the
host's Docker credential store; credentials are not forwarded into containers.
Public images do not require a login.

Image mode runs the exact backend digest once with `prisma db push` against the
empty, isolated BookIT database, and checks its exit status before starting the
application. It does not generate a client from the checkout or migrate on normal
backend startup. No production database is touched.

The browser connects to the backend's mapped port. Backend API routes stay under
`/api`; all other requests proxy to the Nginx frontend container on port 80, as
in production Compose. Both BookIT containers retain their production commands
and the backend runs with `NODE_ENV=production`. Images target `linux/amd64`;
Docker Desktop on Apple Silicon runs them under emulation.

In image mode Gamma uses `gamma.localhost:<port>` as its single OIDC issuer:
Chromium resolves it to host loopback, while the backend resolves the identical
name through a Docker network alias. Gamma listens on that port inside its
container too. No issuer rewriting, authentication mocks, or development proxy
are involved.

## CI image lifecycle and fork PRs

Quality checks run first. Trusted runs then publish frontend/backend candidates
to GHCR, tagged `candidate-<commit>-<run-id>-<attempt>`. PRs use GitHub's checked-out
merge commit, so the candidates contain exactly the source that quality checks
examined. Build outputs pass immutable `repository@sha256:...` references to E2E.
The candidate and E2E jobs have only package-write and package-read permissions,
respectively, plus checkout read access; login credentials are cleaned up by the
login action.

After image E2E passes on a push to main, a separate job copies those manifests to
the commit-SHA and `latest` tags and verifies the resulting digests. It never
rebuilds. It refuses promotion if main has advanced. PRs and manual dispatches
publish candidates only and never update production tags. E2E also dry-runs the
manifest-copy operation without writing registry tags.

Fork PRs and Dependabot PRs run quality checks only. They receive no registry
credentials and skip candidate publication/image E2E. After reviewing their code,
a maintainer must place it on a trusted branch in this repository to get image
coverage before merging. We do not use `pull_request_target` to execute PR code.
GHCR packages must grant this repository's Actions token write/read access; this
may need configuring for pre-existing packages.

Candidate tags are retained for debugging; apply a registry retention policy
separately without removing digests referenced by production tags. Failures retain
the E2E console log (including image references and startup logs), browser traces,
screenshots, video, and bounded per-container logs. Normal completion and failure
both stop the owned containers/network; Testcontainers' resource reaper handles
abrupt runner termination.

The spec files contain focused, independent tests rather than one long test
per file. Booking lifecycle and concurrency, calendar navigation and drag/edit
consistency, language persistence, mobile layout, rule validation/lifecycle, and
UI/API permissions have separate results. Each test gets its own login and data
reset; the services stay shared for the worker.

Prefer `getByRole` with an accessible name and scope it to the relevant dialog or
navigation when needed. Date/time fields use React Aria's named groups and
editable spinbutton segments. `date-time-helpers.ts` enters values through the
keyboard and asserts their accessible numeric values. These are the controls'
actual semantics, not artificial roles added to satisfy a selector.

E2E source uses the same Vite+ formatter as the application:

```sh
pnpm exec vp fmt e2e playwright.config.ts
```

Use `pnpm format` for the whole repository. `pnpm check` checks E2E formatting and
lint in CI as well.

Tests import the extended `test` and `expect` from `./fixtures`. The default page
logs in through Gamma as `member` before the test starts. A spec can use
`test.use({ role: "admin" })` or `test.use({ role: "outsider" })`; `loginAs` lets a
test explicitly switch identity. `authenticate: false` is reserved for tests of
the unauthenticated flow.

The synthetic admin has the BookIT client's `admin` authority, configured through
Gamma's UI. Admin and member belong to digIT; outsider belongs to no group.
Gamma's global bootstrap administrator is used only to provision the OAuth
client and its CLIENT API key. Authentication and authorization are never mocked.

Image versions are explicit in `compose.ts`. BookIT uses PostgreSQL 12.22 and
Redis 5.0.14 to cover its intentionally deferred server upgrades. Gamma 2.5.1 is
pinned by digest, with PostgreSQL 16.0 and Redis 5.0.14 matching the working
`chalmers.it` `test/gamma-integration` reference. These pins are compatibility
baselines, not a claim that the old PostgreSQL/Redis releases receive security
fixes. Upgrade the BookIT servers in their separate infrastructure PRs and update
these test pins alongside them.

On failure, Playwright retains browser artifacts and the fixture attaches bounded
application/Gamma logs with bootstrap credentials redacted. Startup failures print
those logs before cleaning up the owned environment.
