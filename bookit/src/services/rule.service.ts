import { Error, User } from "../models";
import type { InputEvent, InputRule } from "../generated/schema";
import { to } from "../utils";
import { Prisma, rule, room } from "@prisma/client";
import { GraphQLError } from "graphql";
import { validRange } from "../utils/date-range";
import { calendarDate, zonedDateTime } from "../utils/time-zone";

type RuleBooking = Omit<InputEvent, "room" | "booked_as"> & { room: room[] };

/**
 * A single rule that applies to a specific time slot
 */
export interface ExplicitRule {
  start: Date;
  end: Date;
  title: string;
  allow: boolean;
  priority: number;
  description: string | null;
}

// Rules are expanded per calendar day in the time zone of the rooms, and the
// Date values below hold the instants of those wall-clock times.

/** The calendar date (`YYYY-MM-DD`) of an instant. */
export const day = calendarDate;

/** Whether a calendar date (`YYYY-MM-DD`) is in a day mask (bit 0 is Monday). */
export const dayApplies = (date: string, day_mask: number): boolean => {
  const dayIndex = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;

  return (day_mask >> dayIndex) % 2 > 0;
};

const insertRule = (explicitRules: ExplicitRule[], date: string, rule: rule): void => {
  explicitRules.push({
    start: zonedDateTime(date, rule.start_time),
    end: zonedDateTime(date, rule.end_time),
    ...rule,
  });
};

/**
 * Creates a list of explicit rules where each rule apply, i.e., a list of
 * rules that apply to a specific time slot.
 */
export const toExplicitRules = (rules: rule[], from: Date, to: Date): ExplicitRule[] => {
  const explicitRules: ExplicitRule[] = [];

  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) {
    return [];
  }

  if (!validRange(from, to)) {
    throw new GraphQLError("Choose a date range of at most 366 days.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }

  for (const rule of rules) {
    const first = day(new Date(Math.max(from.getTime(), rule.start_date.getTime())));
    const last = day(new Date(Math.min(to.getTime(), rule.end_date.getTime())));

    // Calendar arithmetic happens at UTC midnight, which no TZ setting affects.
    const current = new Date(`${first}T00:00:00Z`);
    const end = new Date(`${last}T00:00:00Z`);

    while (current <= end) {
      const date = current.toISOString().slice(0, 10);

      if (dayApplies(date, rule.day_mask)) {
        if (explicitRules.length >= 10_000) {
          throw new GraphQLError("Too many recurring rules. Choose a shorter date range.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        insertRule(explicitRules, date, rule);
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  return explicitRules.sort((a, b): number => a.priority - b.priority);
};

// Input order defines precedence (toExplicitRules sorts by priority). Keep
// existing intervals and fill their gaps, without recursive array copying.
export const mergeRules = (rules: ExplicitRule[]): ExplicitRule[] => {
  let merged: ExplicitRule[] = [];

  for (const rule of rules) {
    let start = rule.start;

    if (start >= rule.end) {
      continue;
    }

    const next: ExplicitRule[] = [];

    for (const existing of merged) {
      if (start < existing.start && start < rule.end) {
        const end = new Date(Math.min(existing.start.getTime(), rule.end.getTime()));

        next.push({ ...rule, start, end });
      }

      next.push(existing);

      if (existing.end > start) {
        start = existing.end;
      }
    }

    if (start < rule.end) {
      next.push({ ...rule, start });
    }

    merged = next;
  }

  return merged;
};

const breaksExplicitRule = (rule: ExplicitRule, event: RuleBooking): boolean => {
  const start = new Date(event.start);
  const end = new Date(event.end);

  return rule.start < end && rule.end > start && !rule.allow;
};

export const doesObeyRules = (rules: rule[], event: RuleBooking): Error | null => {
  const start = new Date(event.start);
  const end = new Date(event.end);

  for (const room of event.room) {
    const roomRules = rules.filter((rule) => rule.room.includes(room));
    const explicitRules = mergeRules(toExplicitRules(roomRules, start, end));

    for (const rule of explicitRules) {
      if (breaksExplicitRule(rule, event)) {
        return {
          sv: "Bokning bryter regel: " + rule.title,
          en: "Booking breaks rule: " + rule.title,
        };
      }
    }
  }

  return null;
};

// Rule dates are stored as UTC midnight of their calendar date, so these
// bounds include the entire last day of a rule.
export const ruleDateBounds = (from: Date, to: Date) => ({
  end_date: { gte: new Date(`${day(from)}T00:00:00.000Z`) },
  start_date: { lte: new Date(`${day(to)}T00:00:00.000Z`) },
});

export const getRulesBetween = async (prisma: Prisma.TransactionClient, from: Date, to: Date) => {
  return await prisma.rule.findMany({
    where: ruleDateBounds(from, to),
  });
};

export const checkRules = async (prisma: Prisma.TransactionClient, event: RuleBooking) => {
  const rules = await prisma.rule.findMany({
    where: {
      room: {
        hasSome: event.room,
      },
      ...ruleDateBounds(new Date(event.start), new Date(event.end)),
    },
  });

  return doesObeyRules(rules, event);
};

const validDate = (start: Date, end: Date): boolean => {
  return start.getTime() > 0 && end.getTime() > 0 && start <= end;
};

const validDateTime = (start: Date, end: Date): boolean => {
  return start.getTime() > 0 && end.getTime() > 0 && start < end;
};

export const createRule = async (
  prisma: Prisma.TransactionClient,
  rule: Omit<InputRule, "room"> & { room: room[] },
  user: User,
): Promise<Error | null> => {
  if (!user.is_admin) {
    return {
      sv: "Du har inte behörighet att skapa regler",
      en: "You do not have permission to create rules",
    };
  }

  const start = new Date(rule.start_date);
  const end = new Date(rule.end_date);

  if (!validDate(start, end)) {
    return {
      sv: "Ogiltigt datum",
      en: "Invalid date",
    };
  }

  rule.start_date = day(start);
  rule.end_date = day(end);

  const start_time = zonedDateTime(rule.start_date, rule.start_time);
  const end_time = zonedDateTime(rule.start_date, rule.end_time);

  if (!validDateTime(start_time, end_time)) {
    return {
      sv: "Ogiltig tid",
      en: "Invalid time",
    };
  }

  let res = await prisma.rule.create({
    data: {
      day_mask: rule.day_mask ?? 0,
      start_time: rule.start_time,
      end_time: rule.end_time,
      description: rule.description,
      allow: rule.allow ?? true,
      priority: rule.priority ?? 10,
      title: rule.title,
      room: rule.room,
      start_date: new Date(rule.start_date),
      end_date: new Date(rule.end_date),
    },
  });

  if (!res) {
    return {
      sv: "Kunde inte skapa regel",
      en: "Could not create rule",
    };
  }

  return null;
};

export const deleteRule = async (
  prisma: Prisma.TransactionClient,
  id: string,
  user: User,
): Promise<Error | null> => {
  if (!user.is_admin) {
    return {
      sv: "Du har inte behörighet att radera regler",
      en: "You do not have permission to delete rules",
    };
  }

  const rule = await prisma.rule.findUnique({
    where: { id: id },
  });

  if (!rule) {
    return {
      sv: "Kunde inte hitta regel",
      en: "Could not find rule",
    };
  }

  const { err } = await to(
    prisma.rule.delete({
      where: {
        id: id,
      },
    }),
  );

  if (err) {
    console.log(err);

    return {
      sv: "Kunde inte ta bort regel",
      en: "Could not delete rule",
    };
  }

  return null;
};
