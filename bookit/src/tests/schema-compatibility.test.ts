import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vite-plus/test";
import { buildASTSchema, findBreakingChanges, graphql } from "graphql/index.js";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { PrismaClient } from "@prisma/client";
import { getResolvers } from "../resolvers";
import type { User } from "../models";

const directory = resolve(__dirname, "../schemas/v1");
const typeDefs = mergeTypeDefs(
  readdirSync(directory)
    .filter((file) => file.endsWith(".gql"))
    .map((file) => readFileSync(resolve(directory, file), "utf8")),
);
const user: User = {
  sub: "member",
  cid: "member",
  name: "Member",
  nickname: "Member",
  locale: "en",
  groups: ["digit"],
  is_admin: false,
};

describe("main API compatibility", () => {
  it("has no breaking schema changes against the main baseline", () => {
    const baseline = readFileSync(resolve(__dirname, "fixtures/main-schema.graphql"), "utf8");

    expect(
      findBreakingChanges(buildASTSchema(mergeTypeDefs(baseline)), buildASTSchema(typeDefs)),
    ).toEqual([]);
  });

  it("accepts the legacy Boolean delete mutation and keeps authorization", async () => {
    const findUnique = vi.fn<PrismaClient["rule"]["findUnique"]>();
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: getResolvers({ prisma: { rule: { findUnique } } as unknown as PrismaClient }),
    });
    const result = await graphql({
      schema,
      source: "mutation Delete($id: String) { deleteRule(id: $id) }",
      variableValues: { id: "rule" },
      contextValue: { user },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.deleteRule).toBe(false);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("rejects missing legacy arguments before querying or writing the database", async () => {
    // No database methods are supplied: any accidental access fails this test.
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: getResolvers({ prisma: {} as PrismaClient }),
    });

    for (const source of [
      "{ event { id } }",
      "{ rule { id } }",
      "mutation { createEvent { en } }",
      "mutation { editEvent { en } }",
      "mutation { deleteEvent { en } }",
      "mutation { createRule { en } }",
      "mutation { deleteRule }",
      'mutation { createEvent(event: {start: "2026-09-07T08:00:00Z", end: "2026-09-07T09:00:00Z", title: "Test", room: [null], booked_as: "digit", booking_terms: true}) { en } }',
    ]) {
      const result = await graphql({ schema, source, contextValue: { user } });

      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    }
  });

  it("keeps legacy profile queries valid without exposing session identifiers", async () => {
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: getResolvers({ prisma: {} as PrismaClient }),
    });
    const result = await graphql({
      schema,
      source: "{ user { sid jti given_name family_name picture } }",
      contextValue: {
        user: { ...user, sid: "private-session", jti: "private-token", given_name: "Given" },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(result.data?.user).toEqual({
      sid: null,
      jti: null,
      given_name: "Given",
      family_name: null,
      picture: null,
    });
  });
});
