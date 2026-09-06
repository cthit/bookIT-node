import { test, expect } from "./fixtures";
import { bookingDate, fillBooking, graphql } from "./booking-helpers";
import { dateSegments, expectSegments, fillSegments } from "./date-time-helpers";

test("booking dates support keyboard editing and calendar selection without losing the time", async ({
  page,
}) => {
  await page.goto("/new-event");

  const begins = page.getByRole("group", { name: "Begins at", exact: true });
  await fillSegments(begins, { year: 2028, month: 2, day: 28, hour: 12, minute: 30 });

  const minute = begins.getByRole("spinbutton", { name: "minute, Begins at", exact: true });
  await minute.press("ArrowUp");
  await expectSegments(begins, { minute: 31 });
  await minute.press("ArrowDown");
  await minute.press("Tab");

  const trigger = page.getByRole("button", { name: "Choose date for Begins at", exact: true });
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");

  const calendar = page.getByRole("dialog", { name: "Begins at calendar", exact: true });
  const selectedDay = calendar.getByRole("button", { name: /28 February 2028 selected/ });
  await expect(selectedDay).toBeFocused();
  await selectedDay.press("ArrowRight");

  const leapDay = calendar.getByRole("button", { name: "Tuesday, 29 February 2028", exact: true });
  await expect(leapDay).toBeFocused();
  await leapDay.press("Enter");

  await expect(calendar).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expectSegments(begins, { year: 2028, month: 2, day: 29, hour: 12, minute: 30 });

  await trigger.press("Enter");
  await page.keyboard.press("Escape");
  await expect(calendar).not.toBeVisible();
  await expect(trigger).toBeFocused();

  await page.setViewportSize({ width: 390, height: 844 });
  await trigger.click();
  await expect(calendar).toBeVisible();
  const bounds = await calendar.boundingBox();
  if (!bounds) throw new Error("The date picker has no visible bounds");
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("an empty required date is described as invalid and prevents booking submission", async ({
  page,
}) => {
  await page.goto("/new-event");
  await fillBooking(page, "E2E incomplete date");

  const begins = page.getByRole("group", { name: "Begins at", exact: true });
  for (const segment of await begins.getByRole("spinbutton").all()) {
    await segment.press("Home");
    await segment.press("Delete");
  }
  const day = begins.getByRole("spinbutton", { name: "day, Begins at", exact: true });
  await page.getByRole("button", { name: "Save booking", exact: true }).click();

  await expect(page).toHaveURL(/\/new-event$/);
  await expect(day).toHaveAttribute("aria-invalid", "true");
  await expect(day).toBeFocused();
  await expect(page.getByText("Please fill out this field.", { exact: true })).toBeVisible();
  await expect(day).toHaveAccessibleDescription(/Please fill out this field\./);

  const { events } = await graphql<{ events: { title: string }[] }>(page, "{ events { title } }");
  expect(events).toHaveLength(0);

  await fillSegments(begins, { ...dateSegments(await bookingDate(page)), hour: 12, minute: 0 });
  await page.getByRole("button", { name: "Save booking", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  const saved = await graphql<{ events: { title: string }[] }>(page, "{ events { title } }");
  expect(saved.events).toEqual([{ title: "E2E incomplete date" }]);
});
