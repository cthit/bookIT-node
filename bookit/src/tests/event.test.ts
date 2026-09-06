import { describe, expect, it, vi } from "vite-plus/test";
import { Prisma, type PrismaClient, type event, type rule } from "@prisma/client";
import {
  createEvent,
  editEvent,
  moveEvent,
  withBookingTransaction,
} from "../services/event.service";
import { getResolvers } from "../resolvers";
import { queryRange } from "../utils/date-range";
import type { User, Error as BookingError } from "../models";

const owner: User = {
  sub: "alice",
  cid: "alice",
  name: "Alice",
  nickname: "Alice",
  locale: "en",
  groups: ["digit"],
  is_admin: false,
};
const member: User = { ...owner, sub: "bob", cid: "bob" };
const admin: User = { ...member, is_admin: true };

function database(overrides: Partial<event> = {}) {
  let saved: event = {
    id: "00000000-0000-4000-8000-000000000001",
    title: "Latest title",
    description: "Latest instructions",
    phone: "0701111111",
    booked_by: owner.cid,
    booked_as: "digit",
    room: ["GROUP_ROOM"],
    start: new Date(Date.now() + 86_400_000),
    end: new Date(Date.now() + 90_000_000),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
  const transaction = {
    event: {
      findUnique: vi.fn<() => Promise<event>>(async () => saved),
      count: vi.fn<() => Promise<number>>(async () => 0),
      update: vi.fn<(input: { data: Partial<event> }) => Promise<event>>(
        async ({ data }) => (saved = { ...saved, ...data }),
      ),
      create: vi.fn<() => Promise<event>>(),
    },
    rule: { findMany: vi.fn<() => Promise<rule[]>>(async () => []) },
  };
  const prisma = {
    $transaction: vi.fn<
      (operation: (tx: typeof transaction) => Promise<unknown>) => Promise<unknown>
    >(async (operation) => operation(transaction)),
  } as unknown as PrismaClient;

  const input = {
    id: saved.id,
    title: saved.title,
    description: saved.description,
    start: saved.start.toISOString(),
    end: saved.end.toISOString(),
    room: ["GROUP_ROOM"] as const,
    booked_by: saved.booked_by,
    booked_as: saved.booked_as,
    booking_terms: true,
  };

  return { prisma, transaction, saved: () => saved, input: { ...input, room: [...input.room] } };
}

describe("booking contact access", () => {
  it("keeps a hidden contact when a group member edits other fields", async () => {
    const db = database();

    expect(
      await editEvent(db.prisma, { ...db.input, title: "Updated", phone: null }, member),
    ).toBeNull();
    expect(db.saved()).toMatchObject({ title: "Updated", phone: "0701111111", booked_by: "alice" });
    const resolvePhone = getResolvers({ prisma: db.prisma }).Event.phone;

    expect(resolvePhone({ ...db.input, phone: db.saved().phone }, {}, { user: member })).toBe("");
  });

  it("rejects a forged replacement number from another member", async () => {
    const db = database();

    expect(
      (await editEvent(db.prisma, { ...db.input, phone: "0702222222" }, member))?.en,
    ).toContain("contact owner");
    expect(db.transaction.event.update).not.toHaveBeenCalled();
  });

  it.each([owner, admin])(
    "allows the contact owner and administrators to replace a number ($cid, admin=$is_admin)",
    async (user) => {
      const db = database();

      expect(await editEvent(db.prisma, { ...db.input, phone: "0702222222" }, user)).toBeNull();
      expect(db.saved()).toMatchObject({ phone: "0702222222", booked_by: "alice" });
    },
  );

  it("requires a fresh contact when editing an anonymized booking", async () => {
    const db = database({ booked_by: "", phone: "" });

    expect(await editEvent(db.prisma, db.input, member)).not.toBeNull();
    expect(await editEvent(db.prisma, { ...db.input, phone: "0702222222" }, member)).toBeNull();
    expect(db.saved()).toMatchObject({ phone: "0702222222", booked_by: "bob" });
  });
});

describe("calendar moves", () => {
  it("preserves current metadata and contact details while changing only dates", async () => {
    const db = database();
    const before = { ...db.saved() };
    const move = {
      id: before.id,
      previousStart: before.start.toISOString(),
      previousEnd: before.end.toISOString(),
      start: new Date(before.start.getTime() + 3_600_000).toISOString(),
      end: new Date(before.end.getTime() + 3_600_000).toISOString(),
    };

    expect(await moveEvent(db.prisma, move, member)).toBeNull();
    expect(db.saved()).toEqual({ ...before, start: new Date(move.start), end: new Date(move.end) });
    expect((await moveEvent(db.prisma, move, member))?.en).toContain("time has changed");
  });

  it("checks group access, overlaps, and recurring rules for moves", async () => {
    const db = database();
    const previous = db.saved();
    const move = {
      id: previous.id,
      previousStart: previous.start.toISOString(),
      previousEnd: previous.end.toISOString(),
      start: previous.start.toISOString(),
      end: previous.end.toISOString(),
    };

    expect((await moveEvent(db.prisma, move, { ...member, groups: [] }))?.en).toContain(
      "permission",
    );
    db.transaction.event.count.mockResolvedValue(1);
    expect((await moveEvent(db.prisma, move, member))?.en).toContain("already taken");
    expect(db.transaction.event.update).not.toHaveBeenCalled();
    db.transaction.event.count.mockResolvedValue(0);
    expect(await moveEvent(db.prisma, move, member)).toBeNull();
    expect(db.transaction.rule.findMany).toHaveBeenCalled();
  });

  it("retries the complete operation after a serialization conflict", async () => {
    const db = database();
    const operation = vi
      .fn<() => Promise<BookingError | null>>()
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("conflict", {
          code: "P2034",
          clientVersion: "test",
        }),
      )
      .mockResolvedValue(null);

    expect(await withBookingTransaction(db.prisma, operation)).toBeNull();
    expect(operation).toHaveBeenCalledTimes(2);
  });
});

describe("date-range limits", () => {
  it("rejects invalid and excessive queries before database work", () => {
    for (const [from, to] of [
      ["invalid", "2026-01-01"],
      ["2026-01-02", "2026-01-01"],
      ["2026-01-01", "2040-01-01"],
    ]) {
      expect(() => queryRange(from, to)).toThrow("valid date range");
    }

    expect(() => queryRange("2024-01-01", "2025-01-01")).not.toThrow();
  });

  it("rejects excessive booking durations before availability queries", async () => {
    const db = database();
    const { id: _id, ...input } = db.input;

    expect(
      (await createEvent(db.prisma, { ...input, phone: "0701111111", end: "2040-01-01" }, owner))
        ?.en,
    ).toContain("366 days");
    expect(db.transaction.event.count).not.toHaveBeenCalled();
    expect(db.transaction.event.create).not.toHaveBeenCalled();
  });
});
