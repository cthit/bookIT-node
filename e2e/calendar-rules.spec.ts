import { test, expect } from "./fixtures";
import { bookingDate } from "./booking-helpers";
import { dateSegments, fillSegments } from "./date-time-helpers";

test.use({ role: "admin" });

test("overlapping room restrictions share a compact label and respect room filters", async ({
  page,
}) => {
  const date = await bookingDate(page);

  await page.getByRole("navigation").getByRole("link", { name: "Rules", exact: true }).click();

  for (const { title, rooms } of [
    { title: "Maintenance", rooms: ["Storhubben", "Grupprummet"] },
    { title: "Reading", rooms: ["CTC"] },
  ]) {
    await page.getByRole("button", { name: "New rule", exact: true }).click();

    const form = page.getByRole("dialog", { name: "New rule", exact: true });

    await form.getByRole("textbox", { name: "Title", exact: true }).fill(title);

    await form
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("The rooms are unavailable during this time.");

    await form.getByRole("combobox", { name: "Availability", exact: true }).selectOption("false");

    for (const name of ["Start date", "End date"]) {
      await fillSegments(form.getByRole("group", { name, exact: true }), dateSegments(date));
    }

    await fillSegments(form.getByRole("group", { name: "Start time", exact: true }), {
      hour: 12,
      minute: 0,
    });

    await fillSegments(form.getByRole("group", { name: "End time", exact: true }), {
      hour: 13,
      minute: 0,
    });

    for (const room of rooms) {
      await form.getByRole("checkbox", { name: room, exact: true }).check();
    }

    for (const weekday of ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]) {
      await form.getByRole("checkbox", { name: weekday, exact: true }).check();
    }

    await form.getByRole("button", { name: "Save rule", exact: true }).click();
    await expect(form).not.toBeVisible();
    await expect(page.getByRole("row").filter({ hasText: title })).toBeVisible();
  }

  await page.getByRole("navigation").getByRole("link", { name: "Calendar", exact: true }).click();

  const label = page.getByRole("button", { name: "Maintenance · Reading", exact: true });

  await expect(label).toHaveCount(1);
  await expect(label).toHaveCSS("text-overflow", "ellipsis");
  await expect(label).toHaveCSS("white-space", "nowrap");

  await label.hover();

  const tooltip = page.getByRole("tooltip");

  await expect(tooltip).toContainText("Maintenance — The rooms are unavailable during this time.");
  await expect(tooltip).toContainText("Reading — The rooms are unavailable during this time.");
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();

  await label.focus();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).not.toBeVisible();

  await label.click();
  await expect(tooltip).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "CTC", exact: true }).click();
  await expect(label).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Maintenance", exact: true })).toHaveCount(1);

  await page.getByRole("button", { name: "Storhubben", exact: true }).click();
  await expect(page.getByRole("button", { name: "Maintenance", exact: true })).toHaveCount(1);

  await page.getByRole("button", { name: "Grupprummet", exact: true }).click();
  await expect(page.getByRole("button", { name: "Maintenance", exact: true })).toHaveCount(0);
});
