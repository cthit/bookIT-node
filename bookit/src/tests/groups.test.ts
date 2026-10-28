import assert from "node:assert/strict";
import { describe, it } from "vite-plus/test";
import { bookableGroups } from "../auth/groups";

const membership = (id: string, type = "committee") => ({ superGroup: { id, type } });

describe("bookableGroups", () => {
  it("keeps memberships of super groups with the booking authority", () => {
    assert.deepEqual(
      bookableGroups([membership("digit"), membership("hobbyit", "society")], [{ id: "digit" }]),
      ["digit"],
    );
  });

  it("excludes authorized super groups the user is not a member of", () => {
    assert.deepEqual(bookableGroups([membership("digit")], [{ id: "styrit" }]), []);
  });

  it("excludes alumni memberships even when the super group is authorized", () => {
    assert.deepEqual(bookableGroups([membership("didit", "ALUMNI")], [{ id: "didit" }]), []);
  });

  it("lists each super group once across several groups", () => {
    assert.deepEqual(
      bookableGroups([membership("digit"), membership("digit"), {}], [{ id: "digit" }]),
      ["digit"],
    );
  });

  it("allows no group when the authority has no super groups", () => {
    assert.deepEqual(bookableGroups([membership("digit")], []), []);
  });
});
