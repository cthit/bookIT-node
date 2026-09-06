import { test, expect } from "./fixtures";
import { createBooking } from "./booking-helpers";

test("calendar filtering, period navigation and language work on desktop and mobile", async ({
  page,
}) => {
  const title = "E2E calendar meeting";
  await createBooking(page, title);
  const event = page.getByRole("button").filter({ hasText: title });
  const roomFilter = page.getByRole("button", { name: "Storhubben", exact: true });
  await expect(roomFilter).toHaveAttribute("aria-pressed", "true");
  await roomFilter.click();
  await expect(roomFilter).toHaveAttribute("aria-pressed", "false");
  await expect(event).toHaveCount(0);
  await roomFilter.click();
  await expect(event.first()).toBeVisible();

  const period = page.getByRole("heading", { level: 3, name: /\d{4}/ });
  const originalPeriod = await period.innerText();
  await page.getByRole("button", { name: /next/i }).click();
  await expect(period).not.toHaveText(originalPeriod);
  await expect(event).toHaveCount(0);
  await page.getByRole("button", { name: /previous/i }).click();
  await expect(period).toHaveText(originalPeriod);
  await expect(event.first()).toBeVisible();

  await page.getByRole("button", { name: "Switch to Swedish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kalender", exact: true })).toBeAttached();
  await page.reload();
  await expect(page.getByRole("button", { name: "Byt till engelska", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Byt till engelska", exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Calendar", exact: true })).toBeAttached();
  await expect(period).not.toHaveText(originalPeriod);
  const mobilePeriod = await period.innerText();
  await expect(page.getByRole("grid", { name: mobilePeriod, exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: /list/i })).toHaveAttribute("aria-selected", "false");
  await expect(event.first()).toBeVisible();
  await expect(page.getByRole("link", { name: "New booking", exact: true })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
