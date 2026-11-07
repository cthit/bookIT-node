import assert from "node:assert/strict";
import { describe, it } from "vite-plus/test";
import { calendarDate, zonedDateTime } from "../utils/time-zone";
import { inEveryProcessTimeZone } from "./process-time-zone";

describe("Stockholm wall-clock time", () => {
  it("resolves wall-clock times during standard and daylight saving time", () => {
    assert.equal(zonedDateTime("2021-01-15", "08:00").toISOString(), "2021-01-15T07:00:00.000Z");
    assert.equal(zonedDateTime("2021-08-19", "17:00").toISOString(), "2021-08-19T15:00:00.000Z");
    assert.equal(zonedDateTime("2021-08-19", "00:00").toISOString(), "2021-08-18T22:00:00.000Z");
    assert.equal(zonedDateTime("2021-08-19", "24:00").toISOString(), "2021-08-19T22:00:00.000Z");
    assert.equal(
      zonedDateTime("2021-08-19", "08:15:30.25").toISOString(),
      "2021-08-19T06:15:30.250Z",
    );
  });

  it("moves times skipped by a transition forward and picks the first repeated time", () => {
    // 02:30 does not exist on 2021-03-28; 02:30 CET would be 03:30 CEST.
    assert.equal(zonedDateTime("2021-03-28", "02:30").toISOString(), "2021-03-28T01:30:00.000Z");
    assert.equal(zonedDateTime("2021-03-28", "03:00").toISOString(), "2021-03-28T01:00:00.000Z");
    // 02:30 occurs twice on 2021-10-31; the first occurrence is CEST.
    assert.equal(zonedDateTime("2021-10-31", "02:30").toISOString(), "2021-10-31T00:30:00.000Z");
    assert.equal(zonedDateTime("2021-10-31", "03:00").toISOString(), "2021-10-31T02:00:00.000Z");
  });

  it("rejects malformed dates and times", () => {
    for (const [date, time] of [
      ["2021-08-19", "8:00"],
      ["2021-08-19", ""],
      ["2021-08-19", "24:01"],
      ["2021-08-19", "08:60"],
      ["2021-08-19", "08:00Z"],
      ["2021-02-29", "08:00"],
      ["2021-13-01", "08:00"],
      ["2021-8-19", "08:00"],
      ["20210819", "08:00"],
    ]) {
      assert.equal(Number.isNaN(zonedDateTime(date, time).getTime()), true, `${date}T${time}`);
    }

    assert.equal(Number.isNaN(zonedDateTime("2024-02-29", "08:00").getTime()), false);
  });

  it("gives the Stockholm calendar date of an instant", () => {
    assert.equal(calendarDate(new Date("2021-08-18T22:00:00Z")), "2021-08-19");
    assert.equal(calendarDate(new Date("2021-08-18T21:59:59.999Z")), "2021-08-18");
    assert.equal(calendarDate(new Date("2021-12-31T23:00:00Z")), "2022-01-01");
    assert.equal(calendarDate(new Date("2021-12-31T22:59:59Z")), "2021-12-31");
  });

  it("does not depend on the TZ of the process", () => {
    const inputs = [
      ["2021-03-28", "02:30"],
      ["2021-10-31", "02:30"],
      ["2021-08-19", "17:00"],
    ] as const;
    const expected = inputs.map(([date, time]) => zonedDateTime(date, time).getTime());

    inEveryProcessTimeZone((zone) => {
      assert.deepEqual(
        inputs.map(([date, time]) => zonedDateTime(date, time).getTime()),
        expected,
        zone,
      );
      assert.equal(calendarDate(new Date("2021-08-18T22:00:00Z")), "2021-08-19", zone);
    });
  });
});
