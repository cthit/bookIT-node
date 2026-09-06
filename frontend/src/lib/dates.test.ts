import { describe, expect, it } from "vite-plus/test";
import { localInput, parseDate } from "./dates";

describe("booking dates", () => {
  it("accepts ISO dates and the legacy milliseconds contract", () => {
    const date = new Date("2026-10-25T01:30:00.000Z");

    expect(parseDate(date.toISOString()).getTime()).toBe(date.getTime());
    expect(parseDate(String(date.getTime())).getTime()).toBe(date.getTime());
  });

  it("rejects invalid server values", () => {
    expect(() => parseDate("not-a-date")).toThrow("Invalid date");
  });

  it("formats local form values without accidentally converting them to UTC", () => {
    const local = new Date(2026, 8, 6, 14, 30);

    expect(localInput(local)).toBe("2026-09-06T14:30");
    expect(new Date(localInput(local)).getTime()).toBe(local.getTime());
  });
});
