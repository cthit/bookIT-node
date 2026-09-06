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

The spec files contain focused, independent tests rather than one long test
per file. Booking lifecycle and concurrency, calendar navigation and drag/edit
consistency, language persistence, mobile layout, rule validation/lifecycle, and
UI/API permissions have separate results. Each test gets its own login and data
reset; the services stay shared for the worker.

Accessibility regressions cover keyboard date/time editing, leap-day selection,
focus restoration (including calendars inside dialogs), required-date validation,
and the mobile date picker layout.

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

For the manual smoke test, run `pnpm e2e:dev` and open the printed BookIT URL.
The command prints synthetic login credentials and keeps the environment alive.
Ctrl+C stops application processes and removes the test containers and network.

To populate that local preview with 252 bookings and 24 rules, run:

```sh
pnpm exec tsx e2e/stress.ts <local-app-url> <local-gamma-url>
```

The script uses synthetic admin credentials, accepts only localhost URLs, and
resumes without duplicating matching fixtures. It submits six writes concurrently
and reports their p95 response time. The CI stress spec uses the same dataset to
check persistence, multi-room diagonal stripes, calendar views, rule pagination,
and mobile overflow. This is a bounded local stress check, not a production
capacity benchmark. The normal concurrency test also verifies that conflicting
bookings cannot double-book a room.

For screenshots matching the 3840 × 2234 reference images:

```sh
pnpm exec tsx e2e/screenshots.ts <local-app-url> <local-gamma-url> <output-directory>
```

This captures week, month, list and rules from the populated preview at a
1920 × 1117 CSS viewport and 2× pixel density.

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
