import assert from "node:assert/strict";
import { describe, it } from "vite-plus/test";
import { bookingGroupError } from "../resolvers/event.resolver";
import type { User } from "../models/user";

const digit = "aed27030-ad90-4526-855c-1e909b1dcecb";
const styrit = "5d3f8e2a-0c4b-4f6e-9a1d-7b2c3e4f5a6b";

const admin: User = {
  sub: "88eec5c2-5ebb-4e13-9a76-fcc4dac9e74f",
  cid: "bookadmin",
  name: "BookIT Admin",
  nickname: "admin",
  locale: "en",
  groups: [digit],
  is_admin: true,
};

const group = { id: styrit, name: "styrit", prettyName: "styrIT", type: "COMMITTEE" };
const unknown = async () => null;
const gammaDown = async () => Promise.reject(new Error("Gamma down"));

describe("bookingGroupError", () => {
  it("accepts the user's own groups without asking Gamma", async () => {
    assert.equal(await bookingGroupError(digit, admin, null, gammaDown), null);
  });

  it("leaves members to the booking rules without asking Gamma", async () => {
    assert.equal(
      await bookingGroupError(styrit, { ...admin, is_admin: false }, null, gammaDown),
      null,
    );
  });

  it("lets an edit keep the stored group without asking Gamma", async () => {
    assert.equal(await bookingGroupError(styrit, admin, styrit, gammaDown), null);
    assert.equal(await bookingGroupError(styrit, admin, styrit, unknown), null);
  });

  it("accepts other groups that exist in Gamma", async () => {
    assert.equal(await bookingGroupError(styrit, admin, null, async () => group), null);
  });

  it("rejects groups Gamma does not know", async () => {
    assert.equal(
      (await bookingGroupError(styrit, admin, digit, unknown))?.en,
      "Unknown booking group",
    );
  });

  it("reports an unreachable Gamma when checking a new group", async () => {
    assert.match(
      (await bookingGroupError(styrit, admin, null, gammaDown))?.en ?? "",
      /reach Gamma/,
    );
  });
});
