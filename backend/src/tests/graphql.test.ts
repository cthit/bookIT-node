import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { ApolloServer } from "@apollo/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { getResolvers } from "../resolvers";
import type { Context } from "../utils/commonTypes";

// Requests in this suite must be rejected before any database access. There is
// deliberately no database listening here; the E2E suite tests actual persistence.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: "postgresql://test:test@127.0.0.1:1/test" }),
});
const server = new ApolloServer<Context>({
  typeDefs: mergeTypeDefs(loadFilesSync(join(__dirname, "../schemas/v1/*.gql"))),
  resolvers: getResolvers({ prisma }),
});
const contextValue: Context = {
  user: {
    sub: "user-id",
    cid: "member",
    name: "Member",
    nickname: "Member",
    given_name: "",
    family_name: "",
    sid: "",
    locale: "en",
    picture: "",
    jti: "",
    groups: [],
    is_admin: false,
  },
};

describe("Apollo GraphQL contract", () => {
  afterEach(() => vi.restoreAllMocks());
  it.each([
    { cid: "member", is_admin: false, expected: null },
    { cid: "author", is_admin: false, expected: "0701234567" },
    { cid: "member", is_admin: true, expected: "0701234567" },
  ])(
    "protects phones across every booking query for $cid / admin=$is_admin",
    async ({ cid, is_admin, expected }) => {
      const event = {
        id: "booking",
        title: "Booking",
        description: "",
        booked_by: "author",
        booked_as: "digit",
        phone: "0701234567",
        room: ["GROUP_ROOM"],
        start: new Date(),
        end: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.spyOn(prisma.event, "findFirst").mockResolvedValue(event);
      vi.spyOn(prisma.event, "findMany").mockResolvedValue([event]);
      const result = await server.executeOperation(
        {
          query: `{
      event(id: "booking") { phone }
      events { phone }
      eventsFT(from: "2026-09-01", to: "2026-09-30") { phone }
    }`,
        },
        { contextValue: { user: { ...contextValue.user, cid, is_admin, groups: ["digit"] } } },
      );
      if (result.body.kind !== "single") throw new Error("Unexpected incremental response");
      expect(result.body.singleResult.errors).toBeUndefined();
      expect(result.body.singleResult.data).toEqual({
        event: { phone: expected },
        events: [{ phone: expected }],
        eventsFT: [{ phone: expected }],
      });
    },
  );
  it("rejects a supplied ID when creating a new booking before checking availability", async () => {
    const result = await server.executeOperation(
      {
        query: `mutation { createEvent(event: {
        id: "00000000-0000-0000-0000-000000000001", title: "Spoofed booking",
        start: "2026-09-10T10:00:00Z", end: "2026-09-10T11:00:00Z", room: [GROUP_ROOM],
        phone: "0701234567", booked_as: "digit", booking_terms: true
      }) { en } }`,
      },
      { contextValue },
    );
    if (result.body.kind !== "single") throw new Error("Unexpected incremental response");
    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data?.createEvent).toMatchObject({
      en: "New bookings must not specify an existing booking ID",
    });
  });
  beforeAll(() => server.start());
  afterAll(async () => {
    await server.stop();
    await prisma.$disconnect();
  });

  it("rejects null mutation input through schema validation", async () => {
    const result = await server.executeOperation(
      { query: "mutation { createEvent(event: null) { en } }" },
      { contextValue },
    );
    expect(result.body.kind).toBe("single");
    if (result.body.kind === "single")
      expect(result.body.singleResult.errors?.[0].message).toContain("InputEvent!");
  });

  it("returns a typed permission error when a member attempts to delete rules", async () => {
    const result = await server.executeOperation(
      { query: 'mutation { deleteRule(id: "00000000-0000-0000-0000-000000000001") { en sv } }' },
      { contextValue },
    );
    if (result.body.kind !== "single") throw new Error("Unexpected incremental response");
    expect(result.body.singleResult.errors).toBeUndefined();
    expect(result.body.singleResult.data?.deleteRule).toMatchObject({
      en: "You do not have permission to delete rules",
    });
  });

  it("returns the authenticated user's server-side roles and groups", async () => {
    const result = await server.executeOperation(
      { query: "{ user { cid is_admin groups } }" },
      { contextValue },
    );
    if (result.body.kind !== "single") throw new Error("Unexpected incremental response");
    expect(result.body.singleResult.data?.user).toEqual({
      cid: "member",
      is_admin: false,
      groups: [],
    });
  });
});
