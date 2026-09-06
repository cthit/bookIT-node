import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { loginAs } from "./compose";

async function main() {
  const [appUrl, gammaUrl, outputDirectory] = process.argv.slice(2);
  if (!appUrl || !gammaUrl || !outputDirectory)
    throw new Error("Provide local app URL, Gamma URL and output directory");
  for (const url of [appUrl, gammaUrl]) {
    if (!["localhost", "127.0.0.1"].includes(new URL(url).hostname))
      throw new Error("Only localhost previews are supported");
  }
  await mkdir(outputDirectory, { recursive: true });
  const browser = await chromium.launch();
  try {
    // Match the supplied 3840 × 2234 Retina references at a 1920 × 1117 CSS viewport.
    const page = await browser.newPage({
      baseURL: appUrl,
      viewport: { width: 1920, height: 1117 },
      deviceScaleFactor: 2,
    });
    await loginAs(page, { appUrl, gammaUrl }, "admin");
    await expect(
      page.getByRole("button").filter({ hasText: "[Stress] Pub preparations · 1" }).first(),
    ).toBeVisible();
    await page.screenshot({ path: resolve(outputDirectory, "week.png"), animations: "disabled" });

    await page.getByRole("tab", { name: "Month view", exact: true }).click();
    await expect(page.getByRole("button", { name: /\+\d+ more/ }).first()).toBeVisible();
    await page.screenshot({ path: resolve(outputDirectory, "month.png"), animations: "disabled" });

    await page.getByRole("tab", { name: "List view", exact: true }).click();
    const stripes = page
      .getByRole("button")
      .filter({ hasText: "[Stress] Pub preparations · 1" })
      .first();
    await stripes.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: resolve(outputDirectory, "list.png"), animations: "disabled" });

    await page.getByRole("navigation").getByRole("link", { name: "Rules", exact: true }).click();
    await expect(page.getByRole("row")).toHaveCount(11);
    await page.screenshot({ path: resolve(outputDirectory, "rules.png"), animations: "disabled" });
    console.log(`Saved four 3840 × 2234 screenshots to ${outputDirectory}`);
  } finally {
    await browser.close();
  }
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
