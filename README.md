# bookIT

A booking service for the Chalmers Software Engineering Student Division (IT)

## Contributors

- [@molleer](https://github.com/molleer/) David 'Mölle' Möller
- [@x183](https://github.com/x183/) Oscar 'saxen' Palm
- [@Supergamer1337](https://github.com/Supergamer1337/) Felix 'sonic' Bjerhem Aronsson

## Full local environment

With Docker Compose 2.20 or newer, build and start the app, PostgreSQL, Redis,
and a local Gamma instance from the repository root:

```sh
docker compose -f docker-compose.test.yml up --build -d --wait
```

Open [http://localhost:8080](http://localhost:8080). Gamma's OAuth client, API key,
and test users are provisioned automatically, and the app applies database
migrations before starting. No `.env`, Node.js installation, or production
credentials are needed. The first startup may take a few minutes while Gamma
initializes. Gamma's image runs as `linux/amd64`, including on Apple Silicon.

Sign in with `bookmember` (digIT; also in hobbyIT, which may not book),
`bookadmin` (admin), or `bookguest` (no group),
all with password `password1337`. Gamma runs at
[http://gamma.localhost:8081](http://gamma.localhost:8081). The `gamma.localhost`
hostname resolves to loopback in modern browsers and to Gamma inside Docker,
so both use the same OAuth issuer URL. If your OS cannot resolve it for local
Node.js development, add `127.0.0.1 gamma.localhost` to your hosts file.

Stop the stack with `docker compose -f docker-compose.test.yml down`. Add `-v`
to also remove its database volumes. Local credentials are public test fixtures;
this stack binds its exposed ports to loopback and is intended for local use.

## Production

The production Compose file runs the app, PostgreSQL, and Redis (required for
sessions), with persistent data volumes and automatic restarts. Gamma is external.

```sh
cp .env.production.example .env
# Fill in .env before starting; generate DB_PASS and SECRET separately:
openssl rand -hex 32
docker compose -f docker-compose.prod.yml up --build -d --wait
```

Set `BASE_URL` to the public HTTPS address, `ISSUER_BASE_URL` to your Gamma instance
(it must be reachable from browsers too, since bookings link to Gamma profiles),
and supply its `CLIENT_ID`, `CLIENT_SECRET`, and client `API_KEY`. Register
`<BASE_URL>/api/callback` as the Gamma client's redirect URI. Put a TLS reverse
proxy in front of `127.0.0.1:8080`; set `TRUST_PROXY=1` only when using exactly one
trusted proxy. The database and Redis have no published ports. Do not use the
local test credentials for production.

Gamma decides which groups may book rooms. On the BookIT client in Gamma, create
a client authority named `booking` (or the name set in `BOOKING_AUTHORITY`) and
add every super group that may book rooms; members of other super groups cannot
book. Assign the `admin` authority to BookIT administrators, who may book and
manage rules regardless of group. Reading the authority requires Gamma 2.5.3 or
later, which provides `GET /api/client/v1/authorities/{name}`. If the authority
is missing, or Gamma is older, BookIT logs a warning at each sign-in and nobody
can book as a group; other Gamma errors fail the sign-in.

Bookings store only Gamma IDs, as UUIDs: `booked_as` is the super group ID and
`booked_by` the user ID (null once personal data is cleared). Names shown in
BookIT are fetched from Gamma and cached in memory for ten minutes; cached
users are dropped at every privacy cleanup.

Changes to existing data that need more than SQL live in
`bookit/src/data-migrations`. Pending ones run once at startup, after
`prisma migrate deploy` and before the server accepts requests, and are recorded
in the `data_migration` table. If one fails, for example because Gamma is
unreachable, startup fails and it is retried on the next start. The first one
converts bookings from older versions, stored with super group names and cids,
to Gamma IDs. Values without an ID are logged and set to null: groups Gamma no
longer has, old private bookings, and bookers who no longer accept BookIT in
Gamma (handled like bookings whose personal data was cleared). If Gamma returns
no super groups or users, startup fails instead, since that points to a wrong
`ISSUER_BASE_URL`.

These migrations cannot be undone. To go back to an older BookIT version after
upgrading, restore the database backup taken before the upgrade.

The Alpine image runs `prisma migrate deploy` before starting the server and
exits if migrations fail. Back up existing databases before upgrades. For a
database previously managed with `prisma db push`, first verify that its schema
matches `bookit/prisma/schema.prisma`, then baseline the initial migration once:

```sh
docker compose -f docker-compose.prod.yml run --rm app \
  ./node_modules/.bin/prisma migrate resolve --applied 20260920000000_initial
```

Only baseline an existing matching schema; fresh databases migrate automatically.
Do not attach an existing PostgreSQL 12 data directory to the production
PostgreSQL 16 service; use a PostgreSQL dump/restore when moving between versions.

## Local development requirements

- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/en/) 24 (see `.node-version`)
- pnpm 12.3.4

## Local development

The default `docker-compose.yml` runs dependencies while the backend and frontend
run on your host with live reload. Stop the full local stack before using this
mode, since it uses the same ports.

Dependencies, from the repository root:

```sh
corepack enable
corepack prepare pnpm@12.3.4 --activate
pnpm install --frozen-lockfile
pnpm codegen
pnpm --dir bookit exec prisma generate
docker compose up -d --wait db redis gamma
docker compose run --rm gamma-init
test -f .env || cp .env.example .env
```

Set `SECRET` in the root `.env` using `openssl rand -hex 32`. The root `.env.example`
contains local database and Gamma settings; no production credentials are needed.
If upgrading an existing checkout, move `bookit/.env` to `.env` and update the
local `ISSUER_BASE_URL` to `http://gamma.localhost:8081`. Both the backend dev
command and Prisma load the root `.env`. Use a separate checkout or Compose
`--env-file` when keeping production and local settings on the same machine.

Backend:

```sh
pnpm --dir bookit migrate
pnpm --dir bookit dev
```

Frontend, in another terminal:

```sh
pnpm --dir frontend dev
```

Open [http://localhost:8080](http://localhost:8080) to view the website.
Sign in with `bookmember` (digIT; also in hobbyIT, which may not book),
`bookadmin` (admin), or `bookguest` (no group),
all with password `password1337`. Gamma runs at `http://gamma.localhost:8081`.
The GraphQL endpoint is `/api/graphql/v1`.

After changing the Prisma schema, create and commit a migration with
`pnpm --dir bookit exec prisma migrate dev --name <change>`.
`pnpm --dir bookit migrate` applies committed migrations. Existing development
databases also require the one-time baseline described above; use
`pnpm --dir bookit exec prisma migrate resolve --applied 20260920000000_initial`
after verifying their schema.

## E2E tests

With Docker running and Make installed, run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm test:e2e
```

These tests create isolated containers and exercise the image's automatic
migrations against a fresh database as part of normal server startup.

## Technologies

- [Docker](https://www.docker.com/) for development services and production containers
- [PostgreSQL](https://www.postgresql.org/) to store service data
- [Node.js](https://nodejs.org/en/) and [TypeScript](https://www.typescriptlang.org/) for the application
- [Express](https://expressjs.com/) and [Apollo Server](https://www.apollographql.com/docs/apollo-server/) for the GraphQL API
- [Prisma](https://www.prisma.io/docs/) to query the database and apply schema changes
- [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/) and [FullCalendar](https://fullcalendar.io/) for the frontend
- [TanStack Router and Query](https://tanstack.com/) for routing and API data
- [Vite+](https://viteplus.dev/) for builds, tests, linting and formatting
- [Redis](https://redis.io/) to store user sessions
