import { expect, type Page } from "@playwright/test";

export async function bookingDate(page: Page): Promise<string> {
  // Match the browser's date, including CI's configured timezone.
  return page.evaluate(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
}

export async function acceptConditions(page: Page) {
  await page.getByRole("checkbox", { name: /I accept the booking terms/ }).check();
  await page.getByRole("checkbox", { name: /I accept the privacy agreement/ }).check();
  await page.getByRole("checkbox", { name: /I have notified Cubsec/ }).check();
}

export async function fillBooking(page: Page, title: string) {
  const date = await bookingDate(page);

  await page.getByRole("textbox", { name: "Title", exact: true }).fill(title);
  await page.getByRole("textbox", { name: "Phone number", exact: true }).fill("0701234567");

  await expect(page.getByRole("combobox", { name: "Booking as", exact: true })).toHaveValue("");
  await expect(page.getByRole("checkbox", { name: "Storhubben", exact: true })).toBeChecked();

  await page.getByRole("combobox", { name: "Booking as", exact: true }).selectOption("digit");
  await page.getByRole("checkbox", { name: "Storhubben", exact: true }).check();

  await page.getByLabel("Begins at", { exact: true }).fill(`${date}T12:00`);
  await page.getByLabel("Ends at", { exact: true }).fill(`${date}T13:00`);

  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("Planning together in our shared room.");

  await acceptConditions(page);
}

export async function createBooking(page: Page, title: string) {
  await page.goto("/new-event");
  await fillBooking(page, title);

  await page.getByRole("button", { name: "Save booking", exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button").filter({ hasText: title }).first()).toBeVisible();
}

export async function openBooking(page: Page, title: string): Promise<string> {
  await page.getByRole("button").filter({ hasText: title }).first().click();
  await expect(page.getByRole("dialog", { name: "Booking details", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();

  const result = await graphql<{ events: { id: string; title: string }[] }>(
    page,
    "{ events { id title } }",
  );

  const id = result.events.find((event) => event.title === title)?.id;
  if (!id) throw new Error("Booking details did not include a booking id");

  await page.goto(`/bookings/${id}`);
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();

  return id;
}

export async function graphql<T>(
  page: Page,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await page.request.post("/api/graphql/v1", {
    headers: { Origin: new URL(page.url()).origin },
    data: { query, variables },
  });

  expect(response.status()).toBe(200);

  const body = (await response.json()) as { data?: T; errors?: unknown[] };
  expect(body.errors).toBeUndefined();
  if (!body.data) throw new Error("GraphQL response has no data");

  return body.data;
}
