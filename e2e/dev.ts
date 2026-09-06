import { chromium } from "@playwright/test";
import { compose, testPassword, users } from "./compose";

async function main() {
  const browser = await chromium.launch();
  let stopEnvironment: (() => Promise<void>) | undefined;
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    try {
      await stopEnvironment?.();
    } finally {
      await browser.close();
    }
  }
  process.once("SIGINT", () => {
    void stop();
  });
  process.once("SIGTERM", () => {
    void stop();
  });
  try {
    const environment = await compose(browser);
    stopEnvironment = () => environment.stop();
    console.log(`BookIT smoke environment: ${environment.appUrl}`);
    console.log(`Gamma: ${environment.gammaUrl}`);
    console.log(
      `Synthetic users: ${Object.values(users)
        .map((user) => user.cid)
        .join(", ")}; password: ${testPassword}`,
    );
    console.log("Press Ctrl+C to stop and remove this isolated environment.");
  } catch (error) {
    await stop();
    throw error;
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
