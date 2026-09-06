import { GraphQLError } from "graphql";
import type { Room } from "../generated/schema";

// Keep legacy nullable GraphQL arguments while rejecting missing data before
// it reaches Prisma (where an undefined filter could select another record).
export function requiredInput<T>(value: T | null | undefined, name: string): T {
  if (value == null) {
    throw new GraphQLError(`${name} is required`, { extensions: { code: "BAD_USER_INPUT" } });
  }

  return value;
}

export function inputRooms(rooms: (Room | null)[]): Room[] {
  return rooms.map((room) => requiredInput(room, "Room"));
}
