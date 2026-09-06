import { test, expect } from "./fixtures";
import { acceptConditions, createBooking, fillBooking, openBooking } from "./booking-helpers";
import { expectSegments } from "./date-time-helpers";

test("a new-booking link accepts UTC timestamps and preserves their local time", async ({
  page,
}) => {
  const initial = await page.evaluate(() => {
    const date = new Date();

    date.setHours(12, 0, 0, 0);

    return {
      start: date.toISOString(),
      end: new Date(date.getTime() + 3_600_000).toISOString(),
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  });

  await page.goto(`/new-event?${new URLSearchParams({ start: initial.start, end: initial.end })}`);
  await expect(page.getByRole("heading", { name: "New booking", exact: true })).toBeVisible();
  const { year, month, day } = initial;

  await expectSegments(page.getByRole("group", { name: "Begins at", exact: true }), {
    year,
    month,
    day,
    hour: 12,
    minute: 0,
  });
  await expectSegments(page.getByRole("group", { name: "Ends at", exact: true }), {
    year,
    month,
    day,
    hour: 13,
    minute: 0,
  });
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("E2E UTC link booking");
  await page.getByRole("textbox", { name: "Phone number", exact: true }).fill("0701234567");
  await page.getByRole("combobox", { name: "Booking as", exact: true }).selectOption("digit");
  await acceptConditions(page);
  await page.getByRole("button", { name: "Save booking", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await openBooking(page, "E2E UTC link booking");
});

test("a group member creates, edits and deletes a persisted booking", async ({ page }) => {
  const title = "E2E digIT planning";

  await createBooking(page, title);
  await openBooking(page, title);

  await expect(
    page.getByText("Planning together in our shared room.", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await openBooking(page, title);
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.reload();

  await expect(page.getByRole("textbox", { name: "Phone number", exact: true })).toHaveValue(
    "0701234567",
  );

  await page.getByRole("textbox", { name: "Title", exact: true }).fill(`${title} updated`);

  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Agenda updated by a group member.");

  await acceptConditions(page);
  await page.getByRole("button", { name: "Save booking", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);

  await openBooking(page, `${title} updated`);
  await expect(page.getByText("Agenda updated by a group member.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Delete booking?" });

  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: `${title} updated`, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm deletion", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button").filter({ hasText: title })).toHaveCount(0);

  await page.reload();
  await createBooking(page, "E2E replacement booking");
  await expect(page.getByRole("button").filter({ hasText: title })).toHaveCount(0);
});

test("two booking forms cannot reserve the same room and time twice", async ({ page }) => {
  const otherPage = await page.context().newPage();

  const bookings = [
    { page, title: "E2E concurrent booking A" },
    { page: otherPage, title: "E2E concurrent booking B" },
  ];

  try {
    await otherPage.goto("/");

    for (const { page: bookingPage, title } of bookings) {
      await bookingPage.getByRole("link", { name: "New booking", exact: true }).click();
      await fillBooking(bookingPage, title);
    }

    await Promise.all(
      bookings.map(({ page: bookingPage }) =>
        bookingPage.getByRole("button", { name: "Save booking", exact: true }).click(),
      ),
    );

    await expect
      .poll(() => bookings.filter(({ page }) => new URL(page.url()).pathname === "/").length)
      .toBe(1);

    const winner = bookings.find(({ page }) => new URL(page.url()).pathname === "/");
    const loser = bookings.find(({ page }) => new URL(page.url()).pathname !== "/");

    if (!winner || !loser) {
      throw new Error("Expected one saved booking and one rejected booking form");
    }

    await expect(loser.page.getByRole("alert")).toHaveText("The time slot is already taken");
    await winner.page.reload();
    await expect(winner.page.getByRole("button").filter({ hasText: winner.title })).toHaveCount(1);
    await expect(winner.page.getByRole("button").filter({ hasText: loser.title })).toHaveCount(0);
  } finally {
    await otherPage.close();
  }
});
