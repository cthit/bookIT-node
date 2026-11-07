import assert from "node:assert/strict";

// UTC offsets of 2021-08-19T12:00:00Z, in minutes, as Date reports them.
const zones = { UTC: 0, "America/Chicago": 300, "Pacific/Kiritimati": -840, "Asia/Kolkata": -330 };

/**
 * Runs a check once per process time zone. Node re-reads TZ when it is
 * assigned, but only in the main thread, so each switch is verified.
 */
export const inEveryProcessTimeZone = (check: (zone: string) => void): void => {
  const previous = process.env.TZ;

  try {
    for (const [zone, offset] of Object.entries(zones)) {
      process.env.TZ = zone;

      assert.equal(new Date("2021-08-19T12:00:00Z").getTimezoneOffset(), offset, `TZ=${zone}`);
      check(zone);
    }
  } finally {
    if (previous === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previous;
    }
  }
};
