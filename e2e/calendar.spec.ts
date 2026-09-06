import { test, expect } from "./fixtures";
import { createBooking, openBooking } from "./booking-helpers";
import { expectSegments } from "./date-time-helpers";

test("room filters and period navigation show the expected bookings", async ({ page }) => {
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
});

test("editing immediately after a calendar drag preserves the moved times", async ({ page }) => {
  const title = "E2E moved booking";

  await createBooking(page, title);

  const event = page.getByRole("button").filter({ hasText: title });

  const details = page.getByRole("dialog", { name: "Booking details", exact: true });
  const beginsAt = details.getByText("Begins at", { exact: true }).locator("..").locator("dd");
  const endsAt = details.getByText("Ends at", { exact: true }).locator("..").locator("dd");

  await openBooking(page, title);
  const originalStart = await beginsAt.innerText();
  await page.keyboard.press("Escape");

  await event.first().scrollIntoViewIfNeeded();
  const box = await event.first().boundingBox();
  if (!box) {
    throw new Error("Calendar booking has no drag target");
  }

  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 10, { steps: 20 });
  await page.mouse.up();
  await expect(page.getByText("Booking moved", { exact: true })).toBeVisible();

  await openBooking(page, title);
  await expect(beginsAt).not.toHaveText(originalStart);
  const movedStart = await beginsAt.innerText();
  const movedEnd = await endsAt.innerText();

  await page.getByRole("button", { name: "Edit", exact: true }).click();

  for (const [name, value] of [
    ["Begins at", movedStart],
    ["Ends at", movedEnd],
  ] as const) {
    const date = new Date(value.replace(" ", "T"));
    await expectSegments(page.getByRole("group", { name, exact: true }), {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    });
  }

  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Updated after moving the booking.");
  await page.getByRole("button", { name: "Save booking", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.reload();
  await openBooking(page, title);
  await expect(beginsAt).toHaveText(movedStart);
  await expect(endsAt).toHaveText(movedEnd);
  await expect(
    details.getByText("Updated after moving the booking.", { exact: true }),
  ).toBeVisible();
});

test("the selected language survives a reload", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Switch to Swedish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kalender", exact: true })).toBeAttached();

  await page.reload();
  await expect(page.getByRole("button", { name: "Byt till engelska", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Byt till engelska", exact: true }).click();
});

test("the mobile calendar shows bookings without horizontal overflow", async ({ page }) => {
  const title = "E2E mobile booking";

  await createBooking(page, title);

  const event = page.getByRole("button").filter({ hasText: title });
  const period = page.getByRole("heading", { level: 3, name: /\d{4}/ });
  const desktopPeriod = await period.innerText();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Calendar", exact: true })).toBeAttached();
  await expect(period).not.toHaveText(desktopPeriod);

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
