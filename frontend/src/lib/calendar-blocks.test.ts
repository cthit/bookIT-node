import { describe, expect, it } from "vite-plus/test";
import { calendarBlocks } from "./calendar-blocks";

function slot(title: string, start = "06", end = "07", description = "") {
  return {
    title,
    description,
    start: `2026-09-06T${start}:00:00Z`,
    end: `2026-09-06T${end}:00:00Z`,
  };
}

function summary(slots: ReturnType<typeof slot>[]) {
  return calendarBlocks(slots).map(({ start, end, title }) => [
    start.getUTCHours(),
    end.getUTCHours(),
    title,
  ]);
}

describe("calendar blocked-period labels", () => {
  it("deduplicates the same rule returned for multiple rooms", () => {
    const rule = slot("Reading morning", "06", "07", "No bookings");
    const blocks = calendarBlocks([rule, rule, rule]);

    expect(blocks).toHaveLength(1);

    expect(blocks[0]).toMatchObject({
      title: "Reading morning",
      description: "Reading morning — No bookings",
    });
  });

  it("combines simultaneous titles while retaining distinct descriptions", () => {
    const blocks = calendarBlocks([
      slot("Reading", "06", "07", "Quiet time"),
      slot("Maintenance", "06", "07", "Room closed"),
      slot("Reading", "06", "07", "Exam preparation"),
    ]);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.title).toBe("Maintenance · Reading");

    expect(blocks[0]?.description).toBe(
      "Maintenance — Room closed\nReading — Exam preparation\nReading — Quiet time",
    );
  });

  it("splits partial overlaps without extending any restriction", () => {
    expect(summary([slot("A", "06", "08"), slot("B", "07", "09")])).toEqual([
      [6, 7, "A"],
      [7, 8, "A · B"],
      [8, 9, "B"],
    ]);
  });

  it("joins adjacent identical labels but preserves gaps and title changes", () => {
    expect(
      summary([
        slot("A", "06", "07"),
        slot("A", "07", "08"),
        slot("B", "08", "09"),
        slot("B", "10", "11"),
      ]),
    ).toEqual([
      [6, 8, "A"],
      [8, 9, "B"],
      [10, 11, "B"],
    ]);
  });

  it("handles an empty room selection and does not mutate the source rules", () => {
    expect(calendarBlocks([])).toEqual([]);

    const rule = Object.freeze(slot("A"));

    expect(calendarBlocks(Object.freeze([rule, rule]))).toHaveLength(1);
    expect(rule).toEqual(slot("A"));
  });
});
