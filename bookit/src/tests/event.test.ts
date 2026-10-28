import assert from "node:assert/strict";
import { describe, it } from "vite-plus/test";
import { canEditEvent, canMoveEvent } from "../services/event.service";
import type { User } from "../models/user";

// Gamma IDs, as stored on bookings and in sessions.
const digit = "aed27030-ad90-4526-855c-1e909b1dcecb";
const styrit = "5d3f8e2a-0c4b-4f6e-9a1d-7b2c3e4f5a6b";
const adminId = "88eec5c2-5ebb-4e13-9a76-fcc4dac9e74f";

const member: User = {
  sub: "bc605869-9a4d-46ec-8a29-d00819d4c195",
  cid: "bookmember",
  name: "BookIT Member",
  nickname: "member",
  locale: "en",
  groups: [digit],
  is_admin: false,
};

const admin: User = { ...member, sub: adminId, cid: "bookadmin", groups: [], is_admin: true };

const booking = {
  booked_as: digit,
  booked_by: adminId,
  room: ["GROUP_ROOM"],
  phone: "0701234567",
  start: new Date("2026-10-22T10:00:00Z"),
  end: new Date("2026-10-22T12:00:00Z"),
};

describe("canEditEvent", () => {
  it("allows members of the booking group", () => {
    assert.equal(canEditEvent(booking, member), true);
  });

  it("allows administrators regardless of group", () => {
    assert.equal(canEditEvent({ ...booking, booked_as: styrit }, admin), true);
  });

  it("rejects users outside the booking group", () => {
    assert.equal(canEditEvent({ ...booking, booked_as: styrit }, member), false);
  });
});

describe("canMoveEvent", () => {
  it("allows a booking its owner could edit", () => {
    assert.equal(canMoveEvent(booking, member), true);
  });

  it("rejects users outside the booking group", () => {
    assert.equal(canMoveEvent({ ...booking, booked_as: styrit }, member), false);
  });

  it("rejects anonymized bookings, which fail validation unchanged", () => {
    assert.equal(canMoveEvent({ ...booking, booked_by: null }, admin), false);
  });

  it("rejects stored bookings that no longer pass validation", () => {
    assert.equal(canMoveEvent({ ...booking, room: [] }, admin), false);
    assert.equal(canMoveEvent({ ...booking, phone: "" }, admin), false);
    assert.equal(canMoveEvent({ ...booking, booked_as: null }, admin), false);
    assert.equal(canMoveEvent({ ...booking, end: new Date("2027-10-24T12:00:00Z") }, admin), false);
    assert.equal(canMoveEvent({ ...booking, end: booking.start }, admin), false);
  });
});
