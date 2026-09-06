import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, afterEach, describe, expect, it, vi } from "vite-plus/test";
import { createEvent, editEvent, withBookingTransaction } from "../services/event.service";
import type { User } from "../models/user";
import type { Event } from "../models/event";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: "postgresql://test:test@127.0.0.1:1/test" }),
});
const conflict = () =>
  new Prisma.PrismaClientKnownRequestError("Concurrent write", {
    code: "P2034",
    clientVersion: "7.10.0",
  });
// This is the DriverAdapterError shape emitted by @prisma/adapter-pg for
// PostgreSQL serialization_failure (40001) and deadlock_detected (40P01).
const driverConflict = () =>
  Object.assign(
    new Error("TransactionWriteConflict", { cause: { kind: "TransactionWriteConflict" } }),
    {
      name: "DriverAdapterError",
    },
  );

describe("Booking transaction recovery", () => {
  afterEach(() => vi.restoreAllMocks());
  afterAll(() => prisma.$disconnect());

  const user: User = {
    cid: "editor",
    groups: ["digit"],
    is_admin: false,
    sub: "editor",
    sid: "",
    given_name: "",
    locale: "en",
    picture: "",
    name: "Editor",
    nickname: "Editor",
    family_name: "",
    jti: "",
  };
  const input: Event = {
    id: "booking",
    title: "Edited booking",
    start: new Date().toISOString(),
    end: new Date(Date.now() + 3_600_000).toISOString(),
    booked_as: "digit",
    booked_by: "editor",
    booking_terms: true,
    room: ["GROUP_ROOM"],
  };
  it.each([undefined, null, "0707654321"])(
    "preserves the author's identity and handles edit phone %s",
    async (phone) => {
      const previous = {
        id: "booking",
        title: "Booking",
        description: "",
        booked_by: "author",
        booked_as: "digit",
        phone: "0701234567",
        room: ["GROUP_ROOM"],
        start: new Date(input.start),
        end: new Date(input.end),
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.spyOn(prisma, "$transaction").mockImplementation(async (operation) => operation(prisma));
      vi.spyOn(prisma.event, "findUnique").mockResolvedValue(previous);
      vi.spyOn(prisma.event, "count").mockResolvedValue(0);
      vi.spyOn(prisma.rule, "findMany").mockResolvedValue([]);
      const update = vi.spyOn(prisma.event, "update").mockResolvedValue(previous);
      expect(await editEvent(prisma, { ...input, phone }, user)).toBeNull();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: phone ?? "0701234567",
            booked_by: "author",
            title: "Edited booking",
          }),
        }),
      );
    },
  );
  const anonymized = {
    id: "booking",
    title: "Old booking",
    description: "",
    booked_by: "",
    booked_as: "digit",
    phone: "",
    room: ["GROUP_ROOM"],
    start: new Date(Date.now() - 21 * 86_400_000),
    end: new Date(Date.now() - 20 * 86_400_000),
    created_at: new Date(Date.now() - 30 * 86_400_000),
    updated_at: new Date(Date.now() - 30 * 86_400_000),
  };

  it.each([false, true])(
    "lets an authorized editor become the contact for an anonymized booking (admin: %s)",
    async (is_admin) => {
      vi.spyOn(prisma, "$transaction").mockImplementation(async (operation) => operation(prisma));
      vi.spyOn(prisma.event, "findUnique").mockResolvedValue(anonymized);
      vi.spyOn(prisma.event, "count").mockResolvedValue(0);
      vi.spyOn(prisma.rule, "findMany").mockResolvedValue([]);
      const update = vi.spyOn(prisma.event, "update").mockResolvedValue(anonymized);

      expect(
        await editEvent(
          prisma,
          { ...input, phone: "0707654321", booked_by: "untrusted-author" },
          { ...user, is_admin, groups: is_admin ? [] : user.groups },
        ),
      ).toBeNull();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            booked_by: user.cid,
            phone: "0707654321",
            start: new Date(input.start),
            end: new Date(input.end),
          }),
        }),
      );
    },
  );

  it.each([undefined, null, "", "invalid"])(
    "requires a fresh valid phone for an anonymized booking, not %s",
    async (phone) => {
      vi.spyOn(prisma, "$transaction").mockImplementation(async (operation) => operation(prisma));
      // Even inconsistent legacy data must not expose an unowned phone number.
      vi.spyOn(prisma.event, "findUnique").mockResolvedValue({
        ...anonymized,
        phone: "0701234567",
      });
      vi.spyOn(prisma.event, "count").mockResolvedValue(0);
      const update = vi.spyOn(prisma.event, "update");

      expect(await editEvent(prisma, { ...input, phone }, user)).toMatchObject({
        en: "Provided phone number is faulty",
      });
      expect(update).not.toHaveBeenCalled();
    },
  );

  it("does not let an outsider take over an anonymized booking", async () => {
    vi.spyOn(prisma, "$transaction").mockImplementation(async (operation) => operation(prisma));
    vi.spyOn(prisma.event, "findUnique").mockResolvedValue(anonymized);
    const update = vi.spyOn(prisma.event, "update");

    expect(
      await editEvent(prisma, { ...input, phone: "0707654321" }, { ...user, groups: [] }),
    ).toMatchObject({ en: "You do not have permission to edit this event" });
    expect(update).not.toHaveBeenCalled();
  });

  it("still rejects new bookings without a phone", async () => {
    vi.spyOn(prisma, "$transaction").mockImplementation(async (operation) => operation(prisma));
    vi.spyOn(prisma.event, "count").mockResolvedValue(0);
    const create = vi.spyOn(prisma.event, "create");
    expect(await createEvent(prisma, { ...input, id: undefined }, user)).toMatchObject({
      en: "Provided phone number is faulty",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("retries serialization conflicts using serializable isolation", async () => {
    const transaction = vi
      .spyOn(prisma, "$transaction")
      .mockRejectedValueOnce(conflict())
      .mockResolvedValue(null);
    expect(await withBookingTransaction(prisma, async () => null)).toBeNull();
    expect(transaction).toHaveBeenCalledTimes(2);
    expect(transaction).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ isolationLevel: "Serializable" }),
    );
  });

  it("bounds retries and returns a useful error when contention persists", async () => {
    const transaction = vi.spyOn(prisma, "$transaction").mockRejectedValue(conflict());
    expect(await withBookingTransaction(prisma, async () => null)).toMatchObject({
      en: "A booking changed concurrently. Please try again.",
    });
    expect(transaction).toHaveBeenCalledTimes(5);
  });

  it("retries the PostgreSQL adapter's direct commit conflict and returns the rechecked overlap", async () => {
    const overlap = { en: "The time slot is already taken", sv: "Den angivna tiden är upptagen" };
    const transaction = vi
      .spyOn(prisma, "$transaction")
      .mockRejectedValueOnce(driverConflict())
      .mockResolvedValue(overlap);
    expect(await withBookingTransaction(prisma, async () => null)).toEqual(overlap);
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it("bounds retries of direct driver conflicts too", async () => {
    const transaction = vi.spyOn(prisma, "$transaction").mockRejectedValue(driverConflict());
    expect(await withBookingTransaction(prisma, async () => null)).toMatchObject({
      en: "A booking changed concurrently. Please try again.",
    });
    expect(transaction).toHaveBeenCalledTimes(5);
  });

  it.each([
    new Error("TransactionWriteConflict"),
    Object.assign(new Error("DatabaseAccessDenied", { cause: { kind: "DatabaseAccessDenied" } }), {
      name: "DriverAdapterError",
    }),
  ])("does not mistake other errors for a structured driver conflict", async (error) => {
    const transaction = vi.spyOn(prisma, "$transaction").mockRejectedValue(error);
    await expect(withBookingTransaction(prisma, async () => null)).rejects.toBe(error);
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it("does not retry unrelated database failures", async () => {
    const transaction = vi
      .spyOn(prisma, "$transaction")
      .mockRejectedValue(new Error("Connection failed"));
    await expect(withBookingTransaction(prisma, async () => null)).rejects.toThrow(
      "Connection failed",
    );
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
