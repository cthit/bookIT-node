# BookIT browser tests

The suite exercises the real BookIT backend and frontend against a real Gamma
identity provider. `compose.ts` owns the complete environment: an isolated Docker
network, two PostgreSQL containers, two Redis containers, Gamma, Prisma schema
initialization, and the application processes. Ports are assigned per run. It
does not read another checkout or use a developer's database or credentials.

Install dependencies and Playwright Chromium, then use `pnpm test:e2e`. Docker
must be running. A worker shares the container environment, while each test gets
a fresh browser context and cleared BookIT bookings/rules. Run with one worker
to keep the suite's resource usage predictable.

For the manual smoke test, run `pnpm e2e:dev` and open the printed BookIT URL.
The command prints synthetic login credentials and keeps the environment alive.
Ctrl+C stops application processes and removes the test containers and network.

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
