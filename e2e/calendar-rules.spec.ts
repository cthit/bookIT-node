import { test, expect } from "./fixtures";
import { bookingDate, graphql } from "./booking-helpers";

test.use({ role: "admin" });

test("overlapping room restrictions share a compact label and respect room filters", async ({
  page,
}) => {
  const date = await bookingDate(page);

  for (const [title, room] of [
    ["Maintenance", ["BIG_HUB", "GROUP_ROOM"]],
    ["Reading", ["CTC"]],
  ]) {
    const result = await graphql<{ createRule: { en: string } | null }>(
      page,
      "mutation($rule: InputRule!) { createRule(rule: $rule) { en } }",
      {
        rule: {
          title,
          description: "The rooms are unavailable during this time.",
          room,
          start_date: date,
          end_date: date,
          start_time: "12:00",
          end_time: "13:00",
          day_mask: 127,
          priority: 10,
          allow: false,
        },
      },
    );

    expect(result.createRule).toBeNull();
  }

  await page.reload();
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
