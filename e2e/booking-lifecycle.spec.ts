import { test, expect } from "./fixtures";
import {
  acceptConditions,
  bookingDate,
  createBooking,
  graphql,
  openBooking,
} from "./booking-helpers";
import type {
  CreateBookingMutation,
  DeleteBookingMutation,
} from "../frontend/src/generated/graphql";

test("a group member creates, edits and deletes a persisted booking", async ({ page }) => {
  const title = "E2E digIT planning";
  await createBooking(page, title);
  const id = await openBooking(page, title);
  await expect(
    page.getByText("Planning together in our shared room.", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Phone number", { exact: true })).toHaveValue("0701234567");
  await page.getByLabel("Title", { exact: true }).fill(`${title} updated`);
  await page.getByLabel("Description", { exact: true }).fill("Agenda updated by a group member.");
  await acceptConditions(page);
  await page.getByRole("button", { name: "Save booking", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await openBooking(page, `${title} updated`);
  await expect(page).toHaveURL((url) => url.pathname === `/bookings/${id}`);
  await expect(page.getByText("Agenda updated by a group member.", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Delete booking?" });
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: `${title} updated`, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await dialog.getByRole("button", { name: "Confirm deletion", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button").filter({ hasText: title })).toHaveCount(0);
  await page.goto(`/bookings/${id}`);
  await expect(page.getByRole("alert")).toHaveText("Booking not found.");

  // These requests race over HTTP against the real PostgreSQL-backed service.
  // Checking availability and inserting must form one atomic operation.
  const date = await bookingDate(page);
  const titles = ["E2E concurrent booking A", "E2E concurrent booking B"];
  const outcomes = await Promise.all(
    titles.map((concurrentTitle) =>
      graphql<CreateBookingMutation>(
        page,
        "mutation($event: InputEvent!) { createEvent(event: $event) { en sv } }",
        {
          event: {
            title: concurrentTitle,
            phone: "0701234567",
            booked_as: "digit",
            booking_terms: true,
            start: `${date}T15:00:00.000Z`,
            end: `${date}T16:00:00.000Z`,
            room: ["CTC"],
          },
        },
      ),
    ),
  );
  expect(outcomes.filter((outcome) => outcome.createEvent === null)).toHaveLength(1);
  expect(
    outcomes.filter((outcome) => outcome.createEvent?.en === "The time slot is already taken"),
  ).toHaveLength(1);
  const persisted = await graphql<{ events: { id: string; title: string }[] }>(
    page,
    "{ events { id title } }",
  );
  const concurrentBookings = persisted.events.filter((booking) => titles.includes(booking.title));
  expect(concurrentBookings).toHaveLength(1);
  const winner = concurrentBookings[0];
  if (!winner) throw new Error("The successful concurrent booking was not persisted");
  const removed = await graphql<DeleteBookingMutation>(
    page,
    "mutation($id: String!) { deleteEvent(id: $id) { en sv } }",
    { id: winner.id },
  );
  expect(removed.deleteEvent).toBeNull();
  const afterCleanup = await graphql<{ events: { id: string; title: string }[] }>(
    page,
    "{ events { id title } }",
  );
  expect(afterCleanup.events.filter((booking) => titles.includes(booking.title))).toHaveLength(0);
});
