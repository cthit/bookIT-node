import { test, expect } from "./fixtures";
import { createBooking, graphql } from "./booking-helpers";

test("calendar filtering, period navigation and language work on desktop and mobile", async ({
  page,
}) => {
  const title = "E2E calendar meeting";
  await createBooking(page, title);
  const event = page.getByRole("button").filter({ hasText: title });

  // Prime the detail cache, then move and edit before its 20-second freshness
  // window expires. Saving another field must not restore the pre-drag times.
  const readBooking = async () => {
    const { events } = await graphql<{
      events: { title: string; start: string; end: string }[];
    }>(page, "{ events { title start end } }");
    const booking = events.find((entry) => entry.title === title);
    if (!booking) throw new Error("Calendar booking is missing");
    return booking;
  };
  const originalBooking = await readBooking();
  await event.first().click();
  await expect(page.getByRole("dialog", { name: "Booking details", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await event.first().scrollIntoViewIfNeeded();
  const box = await event.first().boundingBox();
  if (!box) throw new Error("Calendar booking has no drag target");
  const movedResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/graphql/v1") &&
      Boolean(response.request().postData()?.includes("mutation UpdateBooking")),
  );
  await page.mouse.move(box.x + box.width / 2, box.y + 10);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 10, { steps: 20 });
  await page.mouse.up();
  expect((await (await movedResponse).json()).data.editEvent).toBeNull();
  const movedBooking = await readBooking();
  expect(movedBooking.start).not.toBe(originalBooking.start);
  await event.first().click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const editStart = await page.getByLabel("Begins at", { exact: true }).inputValue();
  expect(await page.evaluate((value) => new Date(value).toISOString(), editStart)).toBe(
    movedBooking.start,
  );
  await page.getByLabel("Description", { exact: true }).fill("Updated after moving the booking.");
  await page.getByRole("button", { name: "Save booking", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  const savedBooking = await readBooking();
  expect(savedBooking.start).toBe(movedBooking.start);
  expect(savedBooking.end).toBe(movedBooking.end);

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
