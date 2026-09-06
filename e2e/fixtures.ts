import { test as base, expect } from "@playwright/test";
import { compose, loginAs, type Environment, type UserRole } from "./compose";

type TestFixtures = {
  role: UserRole;
  authenticate: boolean;
  isolatedBookings: void;
};

export const test = base.extend<TestFixtures, { environment: Environment }>({
  environment: [
    async ({ browser }, use) => {
      const environment = await compose(browser);

      try {
        await use(environment);
      } finally {
        await environment.stop();
      }
    },
    { scope: "worker", timeout: 480_000 },
  ],

  role: ["member", { option: true }],
  authenticate: [true, { option: true }],

  baseURL: async ({ environment }, use) => {
    await use(environment.appUrl);
  },

  isolatedBookings: [
    async ({ environment }, use, testInfo) => {
      await environment.resetBookings();

      try {
        await use();
      } finally {
        if (testInfo.status !== testInfo.expectedStatus) {
          for (const [name, log] of Object.entries(environment.logs)) {
            await testInfo.attach(`${name}.log`, { body: log, contentType: "text/plain" });
          }
        }
      }
    },
    { auto: true },
  ],

  page: async ({ page, environment, role, authenticate }, use) => {
    if (authenticate) {
      await loginAs(page, environment, role);
    }

    await use(page);
  },
});

export { expect, loginAs };
