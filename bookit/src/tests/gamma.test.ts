import assert from "node:assert/strict";
import { describe, it } from "vite-plus/test";
import { planGammaIds } from "../data-migrations/0001-gamma-ids";
import { displayName } from "../resolvers/gamma.resolver";

const digit = {
  id: "aed27030-ad90-4526-855c-1e909b1dcecb",
  name: "digit",
  prettyName: "digIT",
  type: "COMMITTEE",
};

const member = {
  id: "bc605869-9a4d-46ec-8a29-d00819d4c195",
  cid: "bookmember",
  nick: "Member",
  firstName: "BookIT",
  lastName: "User",
};

const booking = { id: "booking", booked_as: "digit", booked_by: "bookmember" };

describe("planGammaIds", () => {
  it("maps super group names and cids to Gamma IDs", () => {
    assert.deepEqual(planGammaIds([booking], [digit], [member]), {
      updates: [{ id: "booking", booked_as: digit.id, booked_by: member.id }],
      unresolved: [],
    });
  });

  it("clears old private bookings, whose booked_as is a cid rather than a group", () => {
    const { updates, unresolved } = planGammaIds(
      [{ ...booking, booked_as: "bookmember" }],
      [digit],
      [member],
    );

    assert.deepEqual(updates, [{ id: "booking", booked_as: null, booked_by: member.id }]);
    assert.deepEqual(unresolved, [{ id: "booking", field: "booked_as" }]);
  });

  it("skips bookings already stored as IDs, including cleared bookers", () => {
    const converted = { id: "booking", booked_as: digit.id, booked_by: member.id };

    assert.deepEqual(planGammaIds([converted, { ...converted, booked_by: null }], [digit], []), {
      updates: [],
      unresolved: [],
    });
  });

  it("clears and reports values Gamma no longer knows", () => {
    const { updates, unresolved } = planGammaIds(
      [{ ...booking, booked_as: "gone" }],
      [digit],
      [member],
    );

    assert.deepEqual(updates, [{ id: "booking", booked_as: null, booked_by: member.id }]);
    assert.deepEqual(unresolved, [{ id: "booking", field: "booked_as" }]);
  });
});

describe("displayName", () => {
  it("shows the nick quoted between first and last name", () => {
    assert.equal(displayName(member), 'BookIT "Member" User');
  });

  it("leaves out an empty nick", () => {
    assert.equal(displayName({ ...member, nick: "" }), "BookIT User");
  });
});
