import { describe, expect, it } from "vite-plus/test";
import { bookingSearchDate, localInput, parseDate } from "./dates";
import { parseDateTime } from "@internationalized/date";

describe("booking dates", () => {
  it("normalizes UTC and offset query parameters into picker-compatible local values", () => {
    for (const value of ["2026-09-10T12:00:00Z", "2026-09-10T14:00:00+02:00", "2026-09-10T12:00"]) {
      const normalized = bookingSearchDate(value);

      expect(normalized).toBe(localInput(new Date(value)));
      expect(() => parseDateTime(normalized!)).not.toThrow();
      expect(new Date(normalized!).getTime()).toBe(new Date(value).getTime());
    }
  });

  it("discards missing, invalid, and out-of-picker-range query parameters", () => {
    for (const value of [undefined, 123, "not-a-date", "+010000-01-01T00:00:00Z"]) {
      expect(bookingSearchDate(value)).toBeUndefined();
    }
  });

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
