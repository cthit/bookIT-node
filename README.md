# bookIT

Booking service for Teknologsektionen Informationsteknik at Chalmers.

## Stack

- Node 24.19 LTS and pnpm 12.3.4, pinned in `.node-version` and `packageManager`.
- React 19, TypeScript, TanStack Router/Query, shadcn/ui and date-fns.
- FullCalendar 7.1 with its official Monarch shadcn registry components and the CTHIT blue/orange palette.
- Vite+ 0.3: Vite/Rolldown builds, Vitest tests, type-aware Oxlint and Oxfmt through `vp`.
- Express 5, Apollo Server 5, GraphQL 16 and Prisma 7 with the PostgreSQL driver adapter.
- Gamma OpenID Connect authentication; Redis-backed signed sessions.

GraphQL 16 is retained because Apollo Server 5 declares support for that major.
Prisma CLI and client stay on the same stable 7.10 release; the CLI's newer release-candidate tag is not mixed with the stable client.
Node's LTS line and matching Node types are deliberate runtime pins.

## Development

Install the pinned Node version, then from the repository root:

```sh
corepack enable
corepack prepare pnpm@12.3.4 --activate
pnpm install --frozen-lockfile
pnpm codegen
pnpm --dir backend exec prisma generate
```

Install scripts are explicitly approved in `pnpm-workspace.yaml`. Review new blocked
scripts individually; do not globally enable dependency build scripts.

The fastest isolated local environment includes real Gamma and test-only identities:

```sh
pnpm exec playwright install chromium
pnpm e2e:dev
```

Docker must be running with sufficient disk space. Open the printed BookIT URL.
Ctrl+C cleans up only that environment's processes, network and containers.
See [e2e/README.md](e2e/README.md) for roles and the service-version matrix.

For an existing local Gamma installation:

1. Start local backing services with `docker compose up -d db redis`.
2. Copy `backend/.env.example` to `backend/.env` and replace its placeholders.
3. Create a Gamma OAuth client with redirect URL `http://localhost:8080/api/callback`;
   configure its client ID/secret and CLIENT API key in the environment.
4. Generate a strong session secret with `openssl rand -hex 32`.
5. Check that `DATABASE_URL` points only at your local database, then apply the schema
   explicitly with `pnpm --dir backend migrate`.
6. Run `pnpm --dir frontend dev` and `pnpm --dir backend dev` in separate terminals.
7. Open `http://localhost:8080`, the backend's same-origin frontend proxy.

The browser API is `/api/graphql/v1`; login/logout/callback are under `/api`.
`/api/health` is an unauthenticated readiness endpoint. Gamma's client-specific
`admin` authority grants administration. Active (non-alumni) Gamma groups grant
booking rights. Do not use production credentials or data for local tests.

## Checks

```sh
pnpm codegen
pnpm --dir backend exec prisma generate
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm audit --audit-level low
```

`pnpm format` formats source/configuration with Oxfmt. `pnpm check` runs formatting,
type-aware lint and type checking; React hook rules apply only to frontend code,
not Playwright's unrelated fixture callbacks. Generated files are not hand-edited.

The source of the API contract is `backend/src/schemas/v1/*.gql`. The supported
GraphQL Codegen core API generates backend resolver signatures and typed frontend
operation documents from this schema and `frontend/src/api/operations.graphql`.
Both generated outputs are committed; CI rejects stale output.

The redesigned interface keeps the original room filters, multi-room booking colors,
calendar selection and drag-to-move behavior, booking details dialog, group selection,
consent fields, Swedish/English labels, and sortable rules table. Room filters remain
compact so the calendar is the main view; decorative headings are intentionally omitted.

## Browser verification

Complete a manual browser smoke pass before running the automated flows:

```sh
pnpm e2e:dev
# Open the printed URL and check booking, editing/deletion, rules, language/mobile.
# Stop the manual environment, then:
pnpm test:e2e
```

Four separate Playwright specs cover booking persistence, calendar filters and
navigation, administrator rules, and group/outsider authorization. The extended
test fixture authenticates a fresh browser context by default, with configurable
admin/member/outsider identities. It uses real Gamma rather than mocked login.
One `e2e/compose.ts` owns all Testcontainers orchestration and separate databases.

CI enforces contracts, types, lint/format, unit/API tests, builds, dependency audit,
the browser suite, and container builds. Browser failure artifacts are retained.
After quality checks, CI publishes uniquely tagged GHCR candidates and runs E2E
against their immutable digests. Successful main runs promote those same digests
to the existing commit-SHA and latest tags without rebuilding. PR runs never
update production tags. Fork/Dependabot PRs run quality checks only until reviewed
and moved to a trusted branch; they receive no registry credentials.
See [image-mode E2E](e2e/README.md#development-servers-or-published-images) for local
digest-based runs, routing, explicit schema initialization, and registry access.
Actions are SHA-pinned and Dependabot tracks future updates.

## Containers and deployment

Build from the repository root:

```sh
docker build -f backend/Dockerfile -t bookit-backend:local .
docker build -f frontend/Dockerfile -t bookit-frontend:local .
docker build -f db-scripts/Dockerfile -t bookit-cleanup:local db-scripts
```

Backend port: 8080. Frontend Nginx port: 80. Configure the backend's
`FRONTEND_URL` to reach the frontend container. Expose the backend through the
trusted TLS reverse proxy so browser assets and API share an origin. Enable
`TRUST_PROXY=1` only when exactly one trusted proxy is in front.

`prod.docker-compose.yml` builds both application images from the repository root
and connects them to BookIT's private database and Redis services. It uses an
existing Gamma issuer, not the retired bundled Gamma mock/development images.
Supply `DATABASE_URL`, `DB_PASS`, `ISSUER_BASE_URL`, `BASE_URL`, `CLIENT_ID`,
`CLIENT_SECRET`, `API_KEY`, and a strong `SESSION_SECRET` through your deployment
environment (or a protected Compose `--env-file`). For its bundled database,
`DATABASE_URL` must use host `db`, database `bookit`, user `postgres`, and the
URL-encoded `DB_PASS`. Register `${BASE_URL}/api/callback` in Gamma. The backend
binds only to host loopback for a trusted TLS reverse proxy; the other services
are not published. Set `TRUST_PROXY` for your actual proxy topology.

Validate with `docker compose -f prod.docker-compose.yml config --quiet`, then
build with `docker compose -f prod.docker-compose.yml build`. The named
`bookit-db` volume is for new deployments: **do not switch an existing deployment
to it without mapping or migrating its current database storage first**. Back up
data and review the resolved Compose configuration before deploying. Schema
application remains an explicit release step; this file does not run it for you.

Container startup no longer applies schema changes automatically. Before a release,
back up the database, review the Prisma schema diff and apply the approved schema
change explicitly using `pnpm --dir backend migrate` from a release checkout
(or `./node_modules/.bin/prisma db push` inside the backend image).
This repository still uses Prisma schema push, not a versioned migration history.
Never add `--accept-data-loss` as an unattended startup workaround.

Session cookies are now signed; existing users will need to sign in again after
deployment. GraphQL dates now serialize explicitly as ISO strings. Mutation inputs
and IDs are non-null, and `deleteRule` returns the same localized error-or-null
contract as other mutations. Deploy frontend and backend together.

Booking phone numbers are returned only to their original author or an administrator.
An authorized group edit may omit the phone number to preserve it; new bookings still
require one. Edits preserve the original author, and overlapping booking writes are
checked within a serializable transaction.

If privacy cleanup has removed a booking's author, an authorized edit requires a
new phone number and records the editor as the new contact. It never restores the
deleted author's identity or reuses an unowned phone number.

The privacy cleanup retains the existing SQL that clears phone numbers and
booking-user IDs 14 days after an event. Its unsupported Jobber image was replaced
with a small PostgreSQL-client container: cleanup runs on startup and every 24
hours, retrying failures after one hour. It must target the correct application
database and be monitored separately.

## Security and deferred infrastructure upgrades

**PostgreSQL 12 and Redis 5 server upgrades are intentionally separate PRs.**
The development and E2E BookIT images pin PostgreSQL 12.22 and Redis 5.0.14 for
compatibility testing; pinning them does not restore security support. Confirm
actual production versions independently. Neither server should be publicly
exposed, and these follow-ups should not be treated as optional indefinitely.

The modern Redis client explicitly uses RESP2 for Redis 5 compatibility.
Gamma's E2E PostgreSQL and Redis instances are separate from BookIT's; their pins
match the known working Gamma integration reference, not a production upgrade.

Scoped dependency overrides address Prisma's vulnerable deepmerge-ts/MySQL2
transitives and the deprecated Glob version pulled by Testcontainers' archive
helper. Remove those overrides once their parents support patched releases.
Code generation uses local schema files only, avoiding unused remote loaders and
their deprecated fetch polyfills.

A clean package audit means no known advisories were reported for the lockfile
at that time. It does not certify application security or the deferred container
images. CI keeps auditing future runs; service image scanning and production
upgrade reviews remain necessary.

The inherited rule schema has fixed February 2022 defaults for its creation/update
timestamps. The details view displays the stored values; correcting those defaults
and deciding how to repair historical metadata needs a separate schema review.

## Contributors

- [@molleer](https://github.com/molleer/) David 'Mölle' Möller
- [@x183](https://github.com/x183/) Oscar 'saxen' Palm
- [@Supergamer1337](https://github.com/Supergamer1337/) Felix 'sonic' Bjerhem Aronsson
