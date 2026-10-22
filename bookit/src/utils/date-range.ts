import { GraphQLError } from "graphql";

// Includes leap years and every calendar view used by the application.
export const MAX_RANGE_DAYS = 366;
const maxRangeMilliseconds = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;

export function validRange(from: Date, to: Date): boolean {
  return (
    Number.isFinite(from.getTime()) &&
    Number.isFinite(to.getTime()) &&
    from <= to &&
    to.getTime() - from.getTime() <= maxRangeMilliseconds
  );
}

export function queryRange(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);

  if (!validRange(start, end)) {
    throw new GraphQLError(`Choose a valid date range of at most ${MAX_RANGE_DAYS} days.`, {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  return { from: start, to: end };
}
