import { expect, type Locator } from "@playwright/test";

type Segments = Partial<Record<"year" | "month" | "day" | "hour" | "minute", number>>;

export function dateSegments(value: string): Segments {
  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Expected an ISO date, received ${value}`);
  }

  return { year, month, day };
}

export async function fillSegments(field: Locator, values: Segments) {
  for (const [name, value] of Object.entries(values)) {
    const segment = field.getByRole("spinbutton", { name: new RegExp(`^${name},`) });

    // Home resets the segment and its typing buffer before entering a value.
    await segment.press("Home");
    await segment.pressSequentially(String(value));
    await segment.press("Tab");

    await expect(segment).toHaveAttribute("aria-valuenow", String(value));
  }
}

export async function expectSegments(field: Locator, values: Segments) {
  for (const [name, value] of Object.entries(values)) {
    await expect(field.getByRole("spinbutton", { name: new RegExp(`^${name},`) })).toHaveAttribute(
      "aria-valuenow",
      String(value),
    );
  }
}
