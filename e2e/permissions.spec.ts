import { test, expect, loginAs } from "./fixtures";
import { createBooking, openBooking } from "./booking-helpers";

test("an expired session navigates to sign-in and returns to the calendar", async ({
  page,
  environment,
}) => {
  await createBooking(page, "E2E session expiry booking");
  await page.context().clearCookies();
  await page.getByRole("button", { name: /next/i }).click();

  await expect(page).toHaveURL(
    (url) => url.origin === environment.gammaUrl && url.pathname === "/login",
  );
  await page.locator('[name="username"]').fill("bookmember");
  await page.locator('[name="password"]').fill("password1337");
  await page.getByRole("button", { name: "Login", exact: true }).click();

  await expect(page).toHaveURL(`${environment.appUrl}/`);
  await expect(page.getByText("BookIT Member", { exact: true })).toBeVisible();
  await openBooking(page, "E2E session expiry booking");
});

test("an expired BookIT session can sign in again through an existing Gamma session", async ({
  page,
  environment,
}) => {
  await createBooking(page, "E2E Gamma session booking");
  await page.context().clearCookies({ domain: "localhost" });
  await page.getByRole("button", { name: /next/i }).click();

  await expect(page).toHaveURL(`${environment.appUrl}/`);
  await openBooking(page, "E2E Gamma session booking");
});

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
