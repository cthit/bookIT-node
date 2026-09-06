import { chromium } from "@playwright/test";
import { loginAs } from "./compose";
import { populateStress } from "./stress-helpers";

async function main() {
  const [appUrl, gammaUrl] = process.argv.slice(2);
  if (!appUrl || !gammaUrl)
    throw new Error("Usage: pnpm exec tsx e2e/stress.ts <local app URL> <local Gamma URL>");
  for (const url of [appUrl, gammaUrl]) {
    if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
      throw new Error("Stress fixtures may only be added to a localhost test environment");
    }
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ baseURL: appUrl });
    await loginAs(page, { appUrl, gammaUrl }, "admin");
    console.log(JSON.stringify(await populateStress(page, Number(process.argv[4] ?? 6)), null, 2));
  } finally {
    await browser.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
