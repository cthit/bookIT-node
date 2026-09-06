# bookIT

A booking service for the Chalmers Software Engineering Student Division (IT)

## Contributors

- [@molleer](https://github.com/molleer/) David 'Mölle' Möller
- [@x183](https://github.com/x183/) Oscar 'saxen' Palm
- [@Supergamer1337](https://github.com/Supergamer1337/) Felix 'sonic' Bjerhem Aronsson

## Requirements

- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/en/) 24 (see `.node-version`)
- pnpm 12.3.4

## Setup

Dependencies, from the repository root:

```sh
corepack enable
corepack prepare pnpm@12.3.4 --activate
pnpm install --frozen-lockfile
pnpm codegen
pnpm --dir bookit exec prisma generate
docker compose up -d --wait db redis gamma
docker compose run --rm gamma-init
test -f bookit/.env || cp bookit/.env.example bookit/.env
```

Compose starts local Gamma, its test users and BookIT OAuth client, and separate
PostgreSQL/Redis instances for each app. Copy the local authentication values from
`bookit/.env.example` if you already have an `.env`, and set `SESSION_SECRET`
using `openssl rand -hex 32`. No production credentials are needed.

BookIT, after confirming `DATABASE_URL` points to your local database:

```sh
pnpm --dir bookit migrate
docker compose up -d db-scripts
pnpm --dir bookit dev
```

Frontend, in another terminal:

```sh
pnpm --dir frontend dev
```

Open [http://localhost:8080](http://localhost:8080) to view the website.
Sign in with `bookmember` (digIT), `bookadmin` (BookIT admin), or `bookguest`
(no group), all with password `password1337`. Gamma runs at `http://localhost:8081`.
The GraphQL endpoint is `/api/graphql/v1`.

Ordinary startup preserves database contents; do not use `docker compose down -v`
to stop development. Use `docker compose stop` instead. Compose is development-only;
deployments must provide their own authentication settings with `NODE_ENV=production`.
Existing deployments can keep `SECRET` for OIDC; `SESSION_SECRET` is used if `SECRET` is absent.
The `ghcr.io/cthit/bookit` image serves both the API and built frontend on port 8080.
Vite is only used as a separate server during development for live updates.

## Personal-data cleanup

Run the cleanup service alongside every deployment. It clears phone numbers and
CIDs from bookings that ended at least two weeks ago, runs immediately and then
daily, and retries failures after an hour. The application image does not schedule
this job itself. Development Compose includes `db-scripts`.

For production, export the application's `DATABASE_URL` and run:

```sh
docker compose -f compose.cleanup.yml up -d --build
docker compose -f compose.cleanup.yml logs db-scripts
```

For an immediate one-time verification, run
`docker compose -f compose.cleanup.yml run --rm -e CLEANUP_ONCE=1 db-scripts`.
It exits with a failure status if the cleanup query fails.

The database must be reachable from that Compose network. If it runs in Docker,
attach the cleanup service to the database's existing network through your
deployment's Compose configuration. Existing cleanup deployments may continue to
use `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, and `PGPASSWORD` instead of
`DATABASE_URL`. Check the job's logs as part of deployment verification.

## API compatibility and limits

The public GraphQL schema remains compatible with `main`, including nullable
legacy arguments and the Boolean `deleteRule` result. Missing arguments and null
room entries are rejected before database access. Database models are unchanged.
Calendar moves
use the additional `moveEvent` mutation, which updates only dates and rejects a
move when another user has already changed its original times. Members can still
edit shared bookings; replacing a stored contact number requires its owner or an
administrator. Omit `phone` or send `null` to retain the existing contact.
Hidden phone numbers are returned as empty strings. Legacy `User.sid` and
`User.jti` fields remain queryable but are deprecated and always return `null`;
session and token identifiers are not exposed.

Date-range queries and booking durations are limited to 366 days. Recurring rules
can still span multiple years; each query expands only the requested period, with
a maximum of 10,000 rule occurrences per room. Excessive or invalid ranges return
a validation error; existing stored bookings and rules are not deleted or migrated.

Run `pnpm check`, `pnpm test` and `pnpm build` for the project checks.
See [browser tests](e2e/README.md) for Playwright setup and CI image testing.

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

PostgreSQL 12 and Redis 5 server upgrades are deferred to separate PRs.
