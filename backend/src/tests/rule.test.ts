import assert from "assert";
import {
  toExplicitRules,
  ExplicitRule,
  day,
  dayApplies,
  mergeRules,
} from "../services/rule.service";
import { rule } from "@prisma/client";

const defaultRule: rule = {
  id: "",
  day_mask: 0b1111111,
  start_date: new Date(),
  end_date: new Date(),
  start_time: "",
  end_time: "",
  description: "",
  allow: false,
  priority: 10,
  title: "",
  created_at: new Date(),
  updated_at: new Date(),
  room: [],
};

const defaultExplicitRules: ExplicitRule = {
  ...defaultRule,
  start: new Date(),
  end: new Date(),
};

const dummyRules: rule[] = [
  {
    ...defaultRule,
    start_date: new Date("2001-01-01"),
    end_date: new Date("2030-12-31"),
    start_time: "08:00",
    end_time: "17:00",
    day_mask: 0b0011101,
  },
  {
    ...defaultRule,
    start_date: new Date("2001-01-01"),
    end_date: new Date("2030-12-31"),
    start_time: "07:00",
    end_time: "10:00",
    priority: 9,
    allow: true,
    day_mask: 0b0000010,
  },
];

describe("Rule utility functions", () => {
  it("Should create ISO date", () => {
    const date = new Date("2021-08-19");
    const time = "17:00";
    assert.equal(
      new Date("2021-08-19T17:00").toISOString(),
      new Date(day(date) + "T" + time).toISOString(),
    );
  });
  it("Should allow day", () => {
    assert.equal(
      dayApplies(new Date("2021-08-19"), 0b0001000),
      true,
      "0b0001000",
    );
    assert.equal(
      dayApplies(new Date("2021-08-19"), 0b0001100),
      true,
      "0b0001100",
    );
    assert.equal(
      dayApplies(new Date("2021-08-19"), 0b0011000),
      true,
      "0b0011000",
    );
  });
  it("Should not allow day", () => {
    assert.equal(
      dayApplies(new Date("2021-08-19"), 0b1110111),
      false,
      "0b1110111",
    );
    assert.equal(
      dayApplies(new Date("2021-08-19"), 0b0000000),
      false,
      "0b0000000",
    );
    assert.equal(
      dayApplies(new Date("2021-08-19"), 0b0000111),
      false,
      "0b0000111",
    );
  });
});

const assertExplicitRuleEqual = (exp: ExplicitRule, got: ExplicitRule) => {
  assert.equal(got.start.toISOString(), exp.start.toISOString());
  assert.equal(got.description, exp.description);
  assert.equal(got.allow, exp.allow);
};

describe("Rules to ExplicitRules", () => {
  it("Should create one mini rule", () => {
    const expected: ExplicitRule[] = [
      {
        ...defaultExplicitRules,
        start: new Date("2021-08-20T08:00"),
        end: new Date("2021-08-20T17:00"),
      },
    ];
    const got: ExplicitRule[] = toExplicitRules(
      [dummyRules[0]],
      new Date("2021-08-20"),
      new Date("2021-08-20"),
    );
    assert.equal(got.length, expected.length);
    assertExplicitRuleEqual(got[0], expected[0]);
  });
  it("Should create two mini rules", () => {
    const expected: ExplicitRule[] = [
      {
        ...defaultExplicitRules,
        start: new Date("2021-08-19T08:00"),
        end: new Date("2021-08-20T17:00"),
      },
      {
        ...defaultExplicitRules,
        start: new Date("2021-08-20T08:00"),
        end: new Date("2021-08-20T17:00"),
      },
    ];
    const got: ExplicitRule[] = toExplicitRules(
      [dummyRules[0]],
      new Date("2021-08-19"),
      new Date("2021-08-20"),
    );
    assert.equal(got.length, expected.length);
    assertExplicitRuleEqual(got[0], expected[0]);
    assertExplicitRuleEqual(got[1], expected[1]);
  });
  it("Should create two mini rules, one masked out", () => {
    const expected: ExplicitRule[] = [
      {
        ...dummyRules[1],
        start: new Date("2021-08-17T07:00"),
        end: new Date("2021-08-17T10:00"),
      },
      {
        ...dummyRules[0],
        start: new Date("2021-08-18T08:00"),
        end: new Date("2021-08-18T17:00"),
      },
    ];
    const got: ExplicitRule[] = toExplicitRules(
      [dummyRules[0], dummyRules[1]],
      new Date("2021-08-17"),
      new Date("2021-08-18"),
    );
    assert.equal(got.length, expected.length);
    assertExplicitRuleEqual(got[0], expected[0]);
    assertExplicitRuleEqual(got[1], expected[1]);
  });
});

describe("Merge rules", () => {
  it("No rules", () => {
    const expected: ExplicitRule[] = [];
    const got = mergeRules(
      toExplicitRules([], new Date("2021-08-18"), new Date("2021-08-20")),
    );
    assert.deepEqual(got, expected);
  });
  it("One rule", () => {
    const expected: ExplicitRule[] = [
      {
        ...defaultExplicitRules,
        start: new Date("2021-08-20T08:00"),
        end: new Date("2021-08-20T17:00"),
      },
    ];
    const got = mergeRules(
      toExplicitRules(
        [dummyRules[0]],
        new Date("2021-08-20"),
        new Date("2021-08-21"),
      ),
    );

    assert.equal(expected.length, got.length);
    assertExplicitRuleEqual(expected[0], got[0]);
  });
  /**
   *  ---------
   * +++
   * equals
   * +++-------
   */
  it("Two overlapping rules v1", () => {
    const rules: rule[] = [
      {
        ...defaultRule,
        start_date: new Date("2001-01-01"),
        end_date: new Date("2030-12-31"),
        start_time: "08:00",
        end_time: "17:00",
      },
      {
        ...defaultRule,
        start_date: new Date("2001-01-01"),
        end_date: new Date("2030-12-31"),
        start_time: "07:00",
        end_time: "10:00",
        priority: 9,
        allow: true,
      },
    ];
    const expected: ExplicitRule[] = [
      {
        ...rules[1],
        start: new Date("2021-08-20T07:00"),
        end: new Date("2021-08-20T10:00"),
      },
      {
        ...rules[0],
        start: new Date("2021-08-20T10:00"),
        end: new Date("2021-08-20T17:00"),
      },
    ];
    const got = mergeRules(
      toExplicitRules(rules, new Date("2021-08-20"), new Date("2021-08-20")),
    );
    assert.equal(got.length, expected.length);
    assertExplicitRuleEqual(expected[0], got[0]);
    assertExplicitRuleEqual(expected[1], got[1]);
  });
  /**
   *  ---------
   *    +++
   * equals
   *  --+++----
   */
  it("Two overlapping rules v2", () => {
    const rules: rule[] = [
      {
        ...defaultRule,
        start_date: new Date("2001-01-01"),
        end_date: new Date("2030-12-31"),
        start_time: "08:00",
        end_time: "17:00",
      },
      {
        ...defaultRule,
        start_date: new Date("2001-01-01"),
        end_date: new Date("2030-12-31"),
        start_time: "10:00",
        end_time: "13:00",
        priority: 9,
        allow: true,
      },
    ];
    const expected: ExplicitRule[] = [
      {
        ...rules[0],
        start: new Date("2021-08-20T08:00"),
        end: new Date("2021-08-20T10:00"),
      },
      {
        ...rules[1],
        start: new Date("2021-08-20T10:00"),
        end: new Date("2021-08-20T13:00"),
      },
      {
        ...rules[0],
        start: new Date("2021-08-20T13:00"),
        end: new Date("2021-08-20T17:00"),
      },
    ];
    const got = mergeRules(
      toExplicitRules(rules, new Date("2021-08-20"), new Date("2021-08-20")),
    );
    assert.equal(got.length, expected.length);
    assertExplicitRuleEqual(expected[0], got[0]);
    assertExplicitRuleEqual(expected[1], got[1]);
    assertExplicitRuleEqual(expected[2], got[2]);
  });
  /**
   *         ++++
   *  ---------
   *    +++
   * equals
   *  --+++----++
   */
  it("Three overlapping rules", () => {
    const rules: rule[] = [
      {
        ...defaultRule,
        start_date: new Date("2001-01-01"),
        end_date: new Date("2030-12-31"),
        start_time: "08:00",
        end_time: "17:00",
        priority: 9,
      },
      {
        ...defaultRule,
        start_date: new Date("2001-01-01"),
        end_date: new Date("2030-12-31"),
        start_time: "10:00",
        end_time: "13:00",
        priority: 8,
        allow: true,
      },
      {
        ...defaultRule,
        start_date: new Date("2001-01-01"),
        end_date: new Date("2030-12-31"),
        start_time: "15:00",
        end_time: "19:00",
        allow: true,
      },
    ];
    const expected: ExplicitRule[] = [
      {
        ...rules[0],
        start: new Date("2021-08-20T08:00"),
        end: new Date("2021-08-20T10:00"),
      },
      {
        ...rules[1],
        start: new Date("2021-08-20T10:00"),
        end: new Date("2021-08-20T13:00"),
      },
      {
        ...rules[0],
        start: new Date("2021-08-20T13:00"),
        end: new Date("2021-08-20T17:00"),
      },
      {
        ...rules[2],
        start: new Date("2021-08-20T17:00"),
        end: new Date("2021-08-20T19:00"),
      },
    ];
    const got = mergeRules(
      toExplicitRules(rules, new Date("2021-08-20"), new Date("2021-08-20")),
    );
    assert.equal(got.length, expected.length);
    assertExplicitRuleEqual(expected[0], got[0]);
    assertExplicitRuleEqual(expected[1], got[1]);
    assertExplicitRuleEqual(expected[2], got[2]);
    assertExplicitRuleEqual(expected[3], got[3]);
  });
});
