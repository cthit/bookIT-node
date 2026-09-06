import { test, expect } from "./fixtures";
import { graphql } from "./booking-helpers";
import { populateStress } from "./stress-helpers";

test.use({ role: "admin" });

test("a busy fortnight preserves bookings, diagonal stripes and rule pagination", async ({
  page,
}, testInfo) => {
  const result = await populateStress(page);
  expect(result.createdEvents).toBe(252);
  expect(result.createdRules).toBe(24);
  await testInfo.attach("stress-metrics.json", {
    body: JSON.stringify(result),
    contentType: "application/json",
  });

  const persisted = await graphql<{ events: { id: string }[]; rules: { id: string }[] }>(
    page,
    "{ events { id } rules { id } }",
  );
  expect(persisted.events).toHaveLength(252);
  expect(new Set(persisted.events.map((event) => event.id)).size).toBe(252);
  expect(persisted.rules).toHaveLength(24);

  await page.reload();
  const stripedBooking = page
    .getByRole("button")
    .filter({ hasText: "[Stress] Pub preparations · 1" })
    .first();
  await expect(stripedBooking).toBeVisible();
  await expect(stripedBooking).toHaveCSS("background-image", /repeating-linear-gradient\(45deg/);

  // Both the time and title must fit inside narrow striped cards.
  await page.setViewportSize({ width: 1174, height: 1039 });
  const labelsFit = await stripedBooking.evaluate((card) => {
    const bounds = card.getBoundingClientRect();
    const labels = [...card.querySelectorAll(".booking-event-label > *")];

    return (
      labels.length === 2 &&
      labels.every((label) => {
        const rect = label.getBoundingClientRect();
        return rect.left >= bounds.left && rect.right <= bounds.right;
      })
    );
  });
  expect(labelsFit).toBe(true);

  await stripedBooking.click();
  const details = page.getByRole("dialog", { name: "Booking details", exact: true });
  await expect(details).toContainText("Storhubben");
  await expect(details).toContainText("Grupprummet");
  await expect(details).toContainText("CTC");
  await page.keyboard.press("Escape");

  // Arrow keys must change the view, not only the visual tab selection.
  await page.getByRole("tab", { name: "Week view", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "List view", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(stripedBooking).toHaveCSS("background-image", /repeating-linear-gradient\(45deg/);

  await page.getByRole("tab", { name: "Month view", exact: true }).click();
  await page
    .getByRole("button", { name: /\+\d+ more/ })
    .first()
    .click();
  await expect(stripedBooking).toBeVisible();
  await expect(stripedBooking).toHaveCSS("background-image", /repeating-linear-gradient\(45deg/);
  await stripedBooking.click();
  await expect(details).toBeVisible();
  await page.keyboard.press("Escape");

  await page.getByRole("navigation").getByRole("link", { name: "Rules", exact: true }).click();
  await expect(page.getByRole("row")).toHaveCount(11);
  await expect(page.getByText("Page 1 / 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 / 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("row")).toHaveCount(5);
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("navigation").getByRole("link", { name: "Calendar", exact: true }).click();
  await page.getByRole("tab", { name: "List view", exact: true }).click();
  await expect(stripedBooking).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
