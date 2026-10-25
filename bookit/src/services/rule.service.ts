import { Error, User } from "../models";
import type { InputEvent, InputRule } from "../generated/schema";
import { to } from "../utils";
import { Prisma, rule, room } from "@prisma/client";
import { GraphQLError } from "graphql";
import { validRange } from "../utils/date-range";

type RuleBooking = Omit<InputEvent, "room"> & { room: room[] };

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

/**
 * 6  -> "06"
 * 16 -> "16"
 */
const zero = (n: number): string => {
  return n >= 10 ? n.toString() : "0" + n;
};

export const day = (date: Date): string => {
  return `${date.getFullYear()}-${zero(date.getMonth() + 1)}-${zero(date.getDate())}`;
};

export const dayApplies = (date: Date, day_mask: number): boolean => {
  const dayIndex = (Math.floor(date.getDay()) + 6) % 7;

  return (day_mask >> dayIndex) % 2 > 0;
};

const insertRule = (explicitRules: ExplicitRule[], current: Date, rule: rule): void => {
  explicitRules.push({
    start: new Date(day(current) + "T" + rule.start_time),
    end: new Date(day(current) + "T" + rule.end_time),
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
    const current = new Date(Math.max(from.getTime(), rule.start_date.getTime()));
    const end = new Date(Math.min(to.getTime(), rule.end_date.getTime()));

    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      if (dayApplies(current, rule.day_mask)) {
        if (explicitRules.length >= 10_000) {
          throw new GraphQLError("Too many recurring rules. Choose a shorter date range.", {
            extensions: { code: "BAD_USER_INPUT" },
          });
        }

        insertRule(explicitRules, current, rule);
      }

      current.setDate(current.getDate() + 1);
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

const stockholmDate = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// UTC-midnight rule dates include the entire last day in Stockholm time.
export const ruleDateBounds = (from: Date, to: Date) => ({
  end_date: { gte: new Date(`${stockholmDate.format(from)}T00:00:00.000Z`) },
  start_date: { lte: new Date(`${stockholmDate.format(to)}T00:00:00.000Z`) },
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

  const start_time = new Date(rule.start_date + "T" + rule.start_time);
  const end_time = new Date(rule.start_date + "T" + rule.end_time);

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
