import { test, expect } from "./fixtures";
import { bookingDate } from "./booking-helpers";
import { dateSegments, expectSegments, fillSegments } from "./date-time-helpers";

test.use({ role: "admin" });

test("the rule calendar returns keyboard focus without closing its parent dialog", async ({
  page,
}) => {
  await page.getByRole("navigation").getByRole("link", { name: "Rules", exact: true }).click();
  await page.getByRole("button", { name: "New rule", exact: true }).click();

  const form = page.getByRole("dialog", { name: "New rule", exact: true });
  const trigger = form.getByRole("button", { name: "Choose date for End date", exact: true });
  await trigger.press("Enter");

  const calendar = page.getByRole("dialog", { name: "End date calendar", exact: true });
  const day = calendar.getByRole("button", { name: /31 December 2040 selected/ });
  await expect(day).toBeFocused();
  await day.press("ArrowLeft");
  await page.keyboard.press("Enter");

  await expect(calendar).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expectSegments(form.getByRole("group", { name: "End date", exact: true }), {
    year: 2040,
    month: 12,
    day: 30,
  });

  await trigger.press("Enter");
  await page.keyboard.press("Escape");
  await expect(calendar).not.toBeVisible();
  await expect(form).toBeVisible();
  await expect(trigger).toBeFocused();
});

test("a new rule has the original defaults and requires a selected weekday", async ({ page }) => {
  await page.getByRole("navigation").getByRole("link", { name: "Rules", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Rules", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "New rule", exact: true }).click();
  const form = page.getByRole("dialog", { name: "New rule", exact: true });

  await expect(form.getByRole("spinbutton", { name: "Priority", exact: true })).toHaveValue("10");
  await expect(form.getByRole("combobox", { name: "Availability", exact: true })).toHaveValue(
    "true",
  );
  await expectSegments(form.getByRole("group", { name: "End date", exact: true }), {
    year: 2040,
    month: 12,
    day: 31,
  });
  await expect(form.getByRole("checkbox", { checked: true })).toHaveCount(0);

  await form.getByRole("textbox", { name: "Title", exact: true }).fill("E2E room maintenance");
  await form.getByRole("spinbutton", { name: "Priority", exact: true }).fill("2");
  await form.getByRole("combobox", { name: "Availability", exact: true }).selectOption("false");
  await fillSegments(
    form.getByRole("group", { name: "Start date", exact: true }),
    dateSegments(await bookingDate(page)),
  );
  await fillSegments(form.getByRole("group", { name: "Start time", exact: true }), {
    hour: 12,
    minute: 0,
  });
  await fillSegments(form.getByRole("group", { name: "End time", exact: true }), {
    hour: 13,
    minute: 0,
  });
  await form.getByRole("checkbox", { name: "Storhubben", exact: true }).check();
  await form
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("The room is closed for maintenance.");

  await form.getByRole("button", { name: "Save rule", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Select rooms and at least one weekday.");
});

test("an administrator creates, views and deletes a recurring booking rule", async ({ page }) => {
  await page.getByRole("navigation").getByRole("link", { name: "Rules", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Rules", exact: true })).toBeVisible();

  await page.getByRole("button", { name: "New rule", exact: true }).click();
  const form = page.getByRole("dialog", { name: "New rule", exact: true });

  await form.getByRole("textbox", { name: "Title", exact: true }).fill("E2E room maintenance");
  await form.getByRole("spinbutton", { name: "Priority", exact: true }).fill("2");
  await form.getByRole("combobox", { name: "Availability", exact: true }).selectOption("false");
  await fillSegments(
    form.getByRole("group", { name: "Start date", exact: true }),
    dateSegments(await bookingDate(page)),
  );
  await fillSegments(form.getByRole("group", { name: "Start time", exact: true }), {
    hour: 12,
    minute: 0,
  });
  await fillSegments(form.getByRole("group", { name: "End time", exact: true }), {
    hour: 13,
    minute: 0,
  });
  await form.getByRole("checkbox", { name: "Storhubben", exact: true }).check();
  await form
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("The room is closed for maintenance.");

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
