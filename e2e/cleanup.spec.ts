import { test, expect } from "./fixtures";
import { createBooking, fillBooking, openBooking } from "./booking-helpers";
import { dateSegments, fillSegments } from "./date-time-helpers";

test("scheduled cleanup removes old contact data while retaining current bookings", async ({
  page,
  environment,
}) => {
  await createBooking(page, "E2E current contact");
  await page.getByRole("link", { name: "New booking", exact: true }).click();
  await fillBooking(page, "E2E old contact");
  const oldDate = await page.evaluate(() => {
    const date = new Date();

    date.setDate(date.getDate() - 21);

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });

  for (const name of ["Begins at", "Ends at"]) {
    await fillSegments(page.getByRole("group", { name, exact: true }), dateSegments(oldDate));
  }

  await page.getByRole("button", { name: "Save booking", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await environment.cleanupPersonalData();
  await page.reload();
  await openBooking(page, "E2E current contact");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Phone number", exact: true })).toHaveValue(
    "0701234567",
  );

  await page.goto("/");

  for (let week = 0; week < 3; week++) {
    await page.getByRole("button", { name: /previous/i }).click();
  }

  await openBooking(page, "E2E old contact");
  const details = page.getByRole("dialog", { name: "Booking details", exact: true });

  await expect(
    details.getByText("Booked by", { exact: true }).locator("..").locator("dd"),
  ).toHaveText("—");
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Phone number", exact: true })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "Phone number", exact: true })).toHaveAttribute(
    "required",
    "",
  );
});
