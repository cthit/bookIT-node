import { test, expect, loginAs } from "./fixtures";
import { createBooking, openBooking } from "./booking-helpers";

test("an outsider can view bookings but cannot access editing or administration", async ({
  page,
  environment,
}) => {
  await createBooking(page, "E2E protected group booking");
  await loginAs(page, environment, "outsider");

  await expect(page.getByText("BookIT Guest", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "New booking", exact: true }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "You need membership in an active group to make a booking.",
  );

  await expect(page.getByRole("button", { name: "Save booking", exact: true })).toHaveCount(0);

  await page.getByRole("navigation").getByRole("link", { name: "Rules", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Rules", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New rule", exact: true })).toHaveCount(0);

  await page.getByRole("navigation").getByRole("link", { name: "Calendar", exact: true }).click();
  await openBooking(page, "E2E protected group booking");

  await expect(
    page.getByRole("heading", { name: "E2E protected group booking", exact: true }),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete", exact: true })).toHaveCount(0);
});
