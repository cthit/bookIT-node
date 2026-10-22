import assert from "node:assert/strict";
import { describe, it } from "vite-plus/test";
import { canEditEvent, canMoveEvent } from "../services/event.service";
import type { User } from "../models/user";

const member: User = {
  sub: "member",
  cid: "bookmember",
  name: "BookIT Member",
  nickname: "member",
  locale: "en",
  groups: ["digit"],
  is_admin: false,
};

const admin: User = { ...member, cid: "bookadmin", groups: [], is_admin: true };

const booking = {
  booked_as: "digit",
  booked_by: "bookadmin",
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
    assert.equal(canEditEvent({ ...booking, booked_as: "styrit" }, admin), true);
  });

  it("rejects users outside the booking group", () => {
    assert.equal(canEditEvent({ ...booking, booked_as: "styrit" }, member), false);
  });
});

describe("canMoveEvent", () => {
  it("allows a booking its owner could edit", () => {
    assert.equal(canMoveEvent(booking, member), true);
  });

  it("rejects users outside the booking group", () => {
    assert.equal(canMoveEvent({ ...booking, booked_as: "styrit" }, member), false);
  });

  it("rejects anonymized bookings, which fail validation unchanged", () => {
    assert.equal(canMoveEvent({ ...booking, booked_by: "" }, admin), false);
  });

  it("rejects private bookings of restricted rooms, which fail validation unchanged", () => {
    const privateBooking = {
      ...booking,
      booked_as: "bookmember",
      booked_by: "bookmember",
      room: ["BIG_HUB"],
    };

    assert.equal(canMoveEvent(privateBooking, { ...member, groups: ["bookmember"] }), false);
    assert.equal(canMoveEvent({ ...privateBooking, room: ["GROUP_ROOM"] }, admin), true);
  });

  it("rejects stored bookings that no longer pass validation", () => {
    assert.equal(canMoveEvent({ ...booking, room: [] }, admin), false);
    assert.equal(canMoveEvent({ ...booking, phone: "" }, admin), false);
    assert.equal(canMoveEvent({ ...booking, booked_as: " " }, admin), false);
    assert.equal(canMoveEvent({ ...booking, end: new Date("2027-10-24T12:00:00Z") }, admin), false);
    assert.equal(canMoveEvent({ ...booking, end: booking.start }, admin), false);
  });
});
