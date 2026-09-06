import { parseDate } from "./dates";

interface BlockedSlot {
  start: string;
  end: string;
  title: string;
  description?: string | null;
}

interface CalendarBlock {
  start: Date;
  end: Date;
  title: string;
  description: string;
}

// The API resolves rules separately for each room. Combine only their display,
// after room filtering, so simultaneous restrictions cannot paint overlapping labels.
export function calendarBlocks(slots: readonly BlockedSlot[]): CalendarBlock[] {
  const intervals = slots.map((slot) => ({
    ...slot,
    start: parseDate(slot.start).getTime(),
    end: parseDate(slot.end).getTime(),
  }));
  const boundaries = [...new Set(intervals.flatMap(({ start, end }) => [start, end]))].sort(
    (a, b) => a - b,
  );
  const blocks: CalendarBlock[] = [];

  for (let index = 1; index < boundaries.length; index++) {
    const start = boundaries[index - 1]!;
    const end = boundaries[index]!;
    const active = intervals.filter((slot) => slot.start <= start && slot.end >= end);
    if (!active.length) continue;

    const title = [...new Set(active.map((slot) => slot.title))].sort().join(" · ");
    const description = [
      ...new Set(
        active.map((slot) => slot.title + (slot.description ? ` — ${slot.description}` : "")),
      ),
    ]
      .sort()
      .join("\n");
    const previous = blocks.at(-1);

    if (previous?.end.getTime() === start && previous.description === description) {
      previous.end = new Date(end);
    } else {
      blocks.push({ start: new Date(start), end: new Date(end), title, description });
    }
  }

  return blocks;
}
