import { test, expect } from "./fixtures";
import { bookingDate } from "./booking-helpers";

test.use({ role: "admin" });

test("an administrator creates, views and deletes a recurring booking rule", async ({ page }) => {
  await page.getByRole("navigation").getByRole("link", { name: "Rules", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Rules", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "New rule", exact: true }).click();
  const form = page.getByRole("dialog", { name: "New rule", exact: true });
  await expect(form.getByLabel("Priority", { exact: true })).toHaveValue("10");
  await expect(form.getByLabel("Availability", { exact: true })).toHaveValue("true");
  await expect(form.getByLabel("End date", { exact: true })).toHaveValue("2040-12-31");
  await expect(form.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await form.getByLabel("Title", { exact: true }).fill("E2E room maintenance");
  await form.getByLabel("Priority", { exact: true }).fill("2");
  await form.getByLabel("Availability", { exact: true }).selectOption("false");
  await form.getByLabel("Start date", { exact: true }).fill(await bookingDate(page));
  await form.getByLabel("End date", { exact: true }).fill("2040-12-31");
  await form.getByLabel("Start time", { exact: true }).fill("12:00");
  await form.getByLabel("End time", { exact: true }).fill("13:00");
  await form.getByRole("checkbox", { name: "Storhubben", exact: true }).check();
  await form.getByLabel("Description", { exact: true }).fill("The room is closed for maintenance.");
  await form.getByRole("button", { name: "Save rule", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Select rooms and at least one weekday.");
  for (const weekday of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
    await form.getByRole("checkbox", { name: weekday, exact: true }).check();
  }
  await form.getByRole("button", { name: "Save rule", exact: true }).click();
  await expect(form).not.toBeVisible();
  await page.reload();
  const row = page.getByRole("row").filter({ hasText: "E2E room maintenance" });
  await expect(row).toContainText("Storhubben");
  await expect(row).toContainText("12:00–13:00");
  await expect(row).toContainText("Blocked");
  await expect(row).toContainText("Mon · Tue · Wed · Thu · Fri · Sat · Sun");
  await row.getByRole("button", { name: "Details E2E room maintenance", exact: true }).click();
  const details = page.getByRole("dialog", { name: "Rule details", exact: true });
  await expect(
    details.getByText("The room is closed for maintenance.", { exact: true }),
  ).toBeVisible();
  await expect(
    details.getByText("Created", { exact: true }).locator("..").locator("dd"),
  ).toContainText(/\d{4}/);
  await expect(
    details.getByText("Updated", { exact: true }).locator("..").locator("dd"),
  ).toContainText(/\d{4}/);
  await details.press("Escape");
  await expect(details).not.toBeVisible();
  await row.getByRole("button", { name: "Delete E2E room maintenance", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Delete rule?" })
    .getByRole("button", { name: "Confirm deletion", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  await page.reload();
  await expect(page.getByText("No booking rules yet.", { exact: true })).toBeVisible();
});
