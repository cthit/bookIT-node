// Booking rules are defined as wall-clock dates and times in the time zone of
// the rooms. These helpers interpret them in that zone regardless of the TZ of
// the process, so the rule engine behaves the same everywhere it runs.
const timeZone = "Europe/Stockholm";

const wallClockFormat = new Intl.DateTimeFormat("en-US", {
  timeZone,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const millisecondsPerDay = 24 * 60 * 60 * 1000;

const pad = (value: number, length = 2): string => String(value).padStart(length, "0");

// Unlike Date.UTC, this does not treat years below 100 as 19xx.
const utc = (
  year: number,
  month: number,
  dayOfMonth: number,
  hour = 0,
  minute = 0,
  second = 0,
  millisecond = 0,
): number => {
  const date = new Date(0);

  date.setUTCFullYear(year, month - 1, dayOfMonth);
  date.setUTCHours(hour, minute, second, millisecond);

  return date.getTime();
};

/** The wall-clock fields of an instant, encoded as if they were UTC. */
const wallClock = (instant: number): number => {
  const fields: Record<string, number> = {};

  for (const { type, value } of wallClockFormat.formatToParts(instant)) {
    if (type !== "literal") {
      fields[type] = Number(value);
    }
  }

  return utc(fields.year, fields.month, fields.day, fields.hour, fields.minute, fields.second);
};

/** The offset between wall-clock time and UTC at an instant, in milliseconds. */
const offsetAt = (instant: number): number => {
  return wallClock(instant) - Math.floor(instant / 1000) * 1000;
};

/** The calendar date (`YYYY-MM-DD`) of an instant. */
export const calendarDate = (instant: Date): string => {
  const wall = new Date(wallClock(instant.getTime()));

  return `${pad(wall.getUTCFullYear(), 4)}-${pad(wall.getUTCMonth() + 1)}-${pad(wall.getUTCDate())}`;
};

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timePattern = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/;

/**
 * The instant at a wall-clock time (`HH:mm`, optionally with seconds and
 * fractions, or `24:00`) on a calendar date (`YYYY-MM-DD`).
 *
 * Times skipped by a daylight saving transition are moved forward by the length
 * of the gap and repeated times resolve to their first occurrence, which is how
 * `new Date("YYYY-MM-DDTHH:mm")` behaves for a process running in the zone.
 * Malformed input yields an invalid Date.
 */
export const zonedDateTime = (date: string, time: string): Date => {
  const dateMatch = datePattern.exec(date);
  const timeMatch = timePattern.exec(time);

  if (!dateMatch || !timeMatch) {
    return new Date(Number.NaN);
  }

  const [year, month, dayOfMonth] = dateMatch.slice(1).map(Number);
  const [hour, minute, second] = timeMatch.slice(1, 4).map((part) => Number(part ?? 0));
  const millisecond = Number((timeMatch[4] ?? "").slice(0, 3).padEnd(3, "0"));
  const daysInMonth = new Date(utc(year, month + 1, 0)).getUTCDate();

  if (
    month < 1 ||
    month > 12 ||
    dayOfMonth < 1 ||
    dayOfMonth > daysInMonth ||
    hour > 24 ||
    minute > 59 ||
    second > 59 ||
    (hour === 24 && minute + second + millisecond > 0)
  ) {
    return new Date(Number.NaN);
  }

  const wall = utc(year, month, dayOfMonth, hour, minute, second, millisecond);
  const before = offsetAt(wall - millisecondsPerDay);
  const after = offsetAt(wall + millisecondsPerDay);
  const instants = [...new Set([before, after])]
    .map((offset) => wall - offset)
    .filter((instant) => offsetAt(instant) === wall - instant);

  return new Date(instants.length > 0 ? Math.min(...instants) : wall - before);
};
