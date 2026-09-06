import { expect, type Browser, type Page } from "@playwright/test";
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, Network, Wait, type StartedTestContainer } from "testcontainers";
import { createServer, type AddressInfo } from "node:net";

export const images = {
  bookitPostgres: "postgres:12.22-alpine",
  bookitRedis: "redis:5.0.14-alpine",
  gammaPostgres: "postgres:16.0-alpine",
  gammaRedis: "redis:5.0.14-alpine",
  gamma:
    "ghcr.io/cthit/gamma:2.5.1@sha256:5112c5673ee5c98b072c38afe4ed0de5f7f7d6ae85c41bbd318c92f0e3d5d9db",
} as const;

const users = {
  admin: {
    id: "88eec5c2-5ebb-4e13-9a76-fcc4dac9e74f",
    cid: "bookadmin",
    nick: "BookIT Admin",
    groups: ["digit"],
  },
  member: {
    id: "bc605869-9a4d-46ec-8a29-d00819d4c195",
    cid: "bookmember",
    nick: "BookIT Member",
    groups: ["digit"],
  },
  outsider: {
    id: "ec8987d7-4087-461d-bed5-9365086b6e3b",
    cid: "bookguest",
    nick: "BookIT Guest",
    groups: [],
  },
} as const;

export type UserRole = keyof typeof users;

const testPassword = "password1337";

const groupId = "aed27030-ad90-4526-855c-1e909b1dcecb";

const postId = "7bb1db15-730d-4864-bfc3-99abe7c0ccf8";

const seed = {
  users: Object.values(users).map((user) => ({
    id: user.id,
    cid: user.cid,
    nick: user.nick,
    firstName: "BookIT",
    lastName: user.cid,
    acceptanceYear: 2020,
  })),
  superGroups: [{ id: groupId, name: "digit", prettyName: "digIT", type: "COMMITTEE" }],
  groups: [
    {
      id: "acd27030-ad90-4526-855c-1e909b1dcecb",
      name: "digit-test",
      prettyName: "digIT test",
      superGroupId: groupId,
      members: [users.admin, users.member].map((user) => ({ userId: user.id, postId })),
    },
  ],
  posts: [{ id: postId, postName: { sv: "Testmedlem", en: "Test member" } }],
};

export interface Environment {
  appUrl: string;
  gammaUrl: string;
  logs: Record<string, string>;
  resetBookings(): Promise<void>;
  stop(): Promise<void>;
}

async function unusedPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();

    server.on("error", reject);

    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port;

      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function provisionClient(browser: Browser, gammaUrl: string, appUrl: string) {
  const context = await browser.newContext();

  try {
    const page = await context.newPage();

    page.setDefaultTimeout(30_000);
    await page.goto(`${gammaUrl}/login`);
    await page.locator('[name="username"]').fill("admin");
    await page.locator('[name="password"]').fill(testPassword);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page.getByText("Hey, admin!")).toBeVisible();

    await page.goto(`${gammaUrl}/clients/create`);
    await page.locator('[name="prettyName"]').fill("BookIT isolated E2E");
    await page.locator('[name="svDescription"]').fill("Lokalt integrationstest");
    await page.locator('[name="enDescription"]').fill("Isolated BookIT integration test");
    await page.locator('[name="redirectUrl"]').fill(`${appUrl}/api/callback`);
    await page.locator('[name="generateApiKey"]').check();
    await page.getByRole("button", { name: "Create", exact: true }).click();
    await expect(page.getByText("Client details", { exact: true })).toBeVisible();

    const clientId = (await page.locator('li:has-text("Client id:") span').innerText()).trim();

    const credentials = page
      .locator("article")
      .filter({ has: page.locator("header", { hasText: /^\s*Credentials\s*$/ }) });

    const clientSecret = (await credentials.locator("code").first().innerText()).trim();

    const authorization = await credentials
      .locator("code")
      .filter({ hasText: "Authorization: pre-shared" })
      .innerText();

    const apiKey = authorization.replace("Authorization: pre-shared", "").trim();

    if (!clientId || !clientSecret || !/^[\w-]+:\S+$/.test(apiKey)) {
      throw new Error("Gamma did not return complete OAuth and CLIENT API credentials");
    }

    // BookIT uses client-specific authority, not Gamma's global admin flag.
    await page.locator('[name="authority"]').fill("admin");
    await page.getByRole("button", { name: "Add user authority", exact: true }).click();
    await page.locator(".authority-user-row").selectOption(users.admin.id);
    await page.getByRole("button", { name: "Save", exact: true }).click();

    await expect(
      page.locator("article").filter({ has: page.locator("header", { hasText: /^\s*admin\s*$/ }) }),
    ).toBeVisible();

    return { clientId, clientSecret, apiKey };
  } finally {
    await context.close();
  }
}

export async function loginAs(
  page: Page,
  environment: Pick<Environment, "appUrl" | "gammaUrl">,
  role: UserRole,
): Promise<void> {
  await page.context().clearCookies();
  await page.goto(`${environment.appUrl}/api/login`);
  await page.waitForURL((url) => url.origin === environment.gammaUrl && url.pathname === "/login");
  await page.locator('[name="username"]').fill(users[role].cid);
  await page.locator('[name="password"]').fill(testPassword);
  await page.getByRole("button", { name: "Login", exact: true }).click();

  await Promise.race([
    page.waitForURL((url) => url.origin === environment.appUrl),
    page.getByRole("button", { name: "Authorize", exact: true }).waitFor(),
  ]);

  if (new URL(page.url()).origin === environment.gammaUrl) {
    await page.getByRole("button", { name: "Authorize", exact: true }).click();
  }

  await page.waitForURL(
    (url) => url.origin === environment.appUrl && url.pathname !== "/api/callback",
  );
}

export async function compose(browser: Browser): Promise<Environment> {
  const image = process.env.BOOKIT_IMAGE;

  if (!image) {
    throw new Error("Run E2E with make -C e2e run-e2e");
  }

  const network = await new Network().start();
  const containers: StartedTestContainer[] = [];
  const logs: Record<string, string> = {};
  let stopped = false;

  const record = (name: string, chunk: Buffer | string) => {
    const text = String(chunk)
      .replace(/(password:)\S+/g, "$1[REDACTED]")
      .replace(/(and code:)\s*\S+/g, "$1 [REDACTED]");

    logs[name] = ((logs[name] ?? "") + text).slice(-100_000);
  };

  const track = async <T extends StartedTestContainer>(pending: Promise<T>): Promise<T> => {
    const container = await pending;

    containers.push(container);

    return container;
  };

  const stop = async () => {
    if (stopped) {
      return;
    }

    stopped = true;

    const failures: unknown[] = [];

    for (const container of containers.toReversed()) {
      try {
        await container.stop({ remove: true, removeVolumes: true });
      } catch (error) {
        failures.push(error);
      }
    }

    try {
      await network.stop();
    } catch (error) {
      failures.push(error);
    }

    if (failures.length) {
      throw new AggregateError(failures, "E2E environment cleanup failed");
    }
  };

  try {
    console.log("Starting isolated PostgreSQL, Redis and Gamma containers...");

    const gammaDb = await track(
      new PostgreSqlContainer(images.gammaPostgres)
        .withNetwork(network)
        .withNetworkAliases("gamma-db")
        .withDatabase("gamma_test")
        .withUsername("gamma_test")
        .withPassword("gamma_test")
        .start(),
    );

    await track(
      new GenericContainer(images.gammaRedis)
        .withNetwork(network)
        .withNetworkAliases("gamma-redis")
        .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
        .start(),
    );

    const bookitDb: StartedPostgreSqlContainer = await track(
      new PostgreSqlContainer(images.bookitPostgres)
        .withNetwork(network)
        .withNetworkAliases("bookit-db")
        .withDatabase("bookit_test")
        .withUsername("bookit_test")
        .withPassword("bookit_test")
        .start(),
    );

    await track(
      new GenericContainer(images.bookitRedis)
        .withNetwork(network)
        .withNetworkAliases("bookit-redis")
        .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
        .start(),
    );

    const gammaPort = await unusedPort();
    // One issuer URL: browser loopback, Docker network alias.
    const gammaUrl = `http://gamma.localhost:${gammaPort}`;
    const appPort = await unusedPort();
    const appUrl = `http://localhost:${appPort}`;

    await track(
      new GenericContainer(images.gamma)
        .withPlatform("linux/amd64")
        .withResourcesQuota({ memory: 2 })
        .withNetwork(network)
        .withNetworkAliases("gamma", "gamma.localhost")
        .withEnvironment({
          DB_HOST: "gamma-db",
          DB_NAME: gammaDb.getDatabase(),
          DB_USER: gammaDb.getUsername(),
          DB_PASSWORD: gammaDb.getPassword(),
          REDIS_HOST: "gamma-redis",
          SERVER_PORT: String(gammaPort),
          BASE_URL: gammaUrl,
          PRODUCTION: "false",
          IS_MOCKING: "true",
          ADMIN_SETUP: "true",
          MOCK_DATA_RESOURCE: "file:/tmp/bookit-gamma-seed.json",
          UPLOAD_FOLDER: "/tmp/uploads/",
        })
        .withCopyContentToContainer([
          { content: JSON.stringify(seed), target: "/tmp/bookit-gamma-seed.json" },
        ])
        .withExposedPorts({ container: gammaPort, host: gammaPort })
        .withLogConsumer((stream) => stream.on("data", (chunk: Buffer) => record("gamma", chunk)))
        .withWaitStrategy(
          Wait.forAll([
            Wait.forHttp("/login", gammaPort).forStatusCode(200),
            Wait.forLogMessage(/Api key of type INFO has been generated/),
          ]),
        )
        .withStartupTimeout(240_000)
        .start(),
    );

    console.log("Provisioning BookIT OAuth client and roles through Gamma...");

    const client = await provisionClient(browser, gammaUrl, appUrl);

    const env = {
      NODE_ENV: "production",
      CI: "true",
      TZ: "Europe/Stockholm",
      DATABASE_URL: "postgresql://bookit_test:bookit_test@bookit-db:5432/bookit_test",
      REDIS_HOST: "bookit-redis",
      REDIS_PORT: "6379",
      REDIS_PASS: "",
      SESSION_SECRET: "secret",
      SECRET: "bookit-isolated-e2e-oidc-secret-at-least-32-characters",
      BASE_URL: appUrl,
      PORT: "8080",
      ISSUER_BASE_URL: gammaUrl,
      CLIENT_ID: client.clientId,
      CLIENT_SECRET: client.clientSecret,
      API_KEY: client.apiKey,
    };

    record("image", image);

    console.log(`Using BookIT image: ${image}`);

    console.log("Initializing the isolated database with the BookIT image...");

    await track(
      new GenericContainer(image)
        .withPlatform("linux/amd64")
        .withNetwork(network)
        .withEnvironment({ DATABASE_URL: env.DATABASE_URL })
        .withCommand(["./node_modules/.bin/prisma", "db", "push"])
        .withLogConsumer((stream) => stream.on("data", (chunk: Buffer) => record("schema", chunk)))
        .withWaitStrategy(Wait.forOneShotStartup())
        .withStartupTimeout(120_000)
        .start(),
    );

    await track(
      new GenericContainer(image)
        .withPlatform("linux/amd64")
        .withNetwork(network)
        .withEnvironment(env)
        .withExposedPorts({ container: 8080, host: appPort })
        .withLogConsumer((stream) => stream.on("data", (chunk: Buffer) => record("bookit", chunk)))
        .withWaitStrategy(Wait.forHttp("/api/health", 8080).forStatusCode(200))
        .withStartupTimeout(120_000)
        .start(),
    );

    return {
      appUrl,
      gammaUrl,
      logs,
      stop,

      async resetBookings() {
        const result = await bookitDb.exec([
          "psql",
          "--username",
          "bookit_test",
          "--dbname",
          "bookit_test",
          "--set",
          "ON_ERROR_STOP=1",
          "--command",
          "TRUNCATE TABLE event, rule;",
        ]);

        if (result.exitCode !== 0) {
          throw new Error(`Could not reset isolated BookIT database: ${result.output}`);
        }
      },
    };
  } catch (error) {
    for (const [name, log] of Object.entries(logs)) {
      console.error(`[${name}]\n${log.slice(-8_000)}`);
    }

    await stop();
    throw error;
  }
}
