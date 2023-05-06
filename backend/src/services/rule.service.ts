import { Event, Rule, Error, User } from "../models";
import { to } from "../utils";
import { PrismaClient, rule } from "@prisma/client";
import { dbRule } from "../models/rule";

const MILLISECONDS_24H = 86400000; // == 1000 * 60 * 60 * 24

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

const sameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() == d2.getFullYear() &&
    d1.getMonth() == d2.getMonth() &&
    d1.getDate() == d2.getDate()
  );
};

/**
 * 6  -> "06"
 * 16 -> "16"
 */
const zero = (n: number): string => {
  return n >= 10 ? n.toString() : "0" + n;
};

export const day = (date: Date): string => {
  return `${date.getFullYear()}-${zero(date.getMonth() + 1)}-${zero(
    date.getDate(),
  )}`;
};

export const dayApplies = (date: Date, day_mask: number): boolean => {
  const dayIndex = (Math.floor(date.getDay()) + 6) % 7;
  return (day_mask >> dayIndex) % 2 > 0;
};

const insertRule = (
  explicitRules: ExplicitRule[],
  current: Date,
  rule: rule,
): void => {
  explicitRules.push({
    start: new Date(day(current) + "T" + rule.start_time),
    end: new Date(day(current) + "T" + rule.end_time),
    ...rule,
  });
};

const hasReachedEndOrTo = (current: Date, end: Date, to: Date): boolean => {
  return sameDay(current, to) || sameDay(current, end);
};

/**
 * Creates a list of explicit rules where each rule apply, i.e., a list of
 * rules that apply to a specific time slot.
 */
export const toExplicitRules = (
  rules: rule[],
  from: Date,
  to: Date,
): ExplicitRule[] => {
  const explicitRules: ExplicitRule[] = [];

  for (const rule_i in rules) {
    let current = new Date(from);
    const end = new Date(rules[rule_i].end_date);
    while (true) {
      if (dayApplies(current, rules[rule_i].day_mask)) {
        insertRule(explicitRules, current, rules[rule_i]);
      }
      if (hasReachedEndOrTo(current, end, to)) {
        break;
      }
      current = new Date(current.getTime() + MILLISECONDS_24H);
    }
  }
  return explicitRules.sort((a, b): number => a.priority - b.priority);
};

/**
 * Returns a list of explicit rules that apply to the given event.
 * If the rule to be inserted overlaps with the next rule in the list,
 * the rule is split into two rules. The first rule is inserted into the list
 * and the second rule is inserted into the list recursively.
 */
const mergeIntoList = (
  rule: ExplicitRule,
  [nextMergedRule, ...mergedRules]: ExplicitRule[],
): ExplicitRule[] => {
  if (rule.start >= rule.end) return [];
  if (nextMergedRule == undefined) return [rule];
  if (nextMergedRule.start > rule.start) {
    if (nextMergedRule.start >= rule.end) {
      return [rule, nextMergedRule, ...mergedRules];
    }
    return [
      { ...rule, end: new Date(nextMergedRule.start) },
      ...mergeIntoList({ ...rule, start: new Date(nextMergedRule.end) }, [
        nextMergedRule,
        ...mergedRules,
      ]),
    ];
  }
  if (nextMergedRule.end > rule.start)
    return [
      nextMergedRule,
      ...mergeIntoList({ ...rule, start: nextMergedRule.end }, mergedRules),
    ];
  return [nextMergedRule, ...mergeIntoList(rule, mergedRules)];
};

export const mergeRules = (rules: ExplicitRule[]): ExplicitRule[] => {
  let mergedRules: ExplicitRule[] = [];
  for (const i in rules) {
    mergedRules = mergeIntoList(rules[i], mergedRules);
  }
  return mergedRules;
};

const breaksExplicitRule = (rule: ExplicitRule, event: Event): boolean => {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return rule.start < end && rule.end > start && !rule.allow;
};

const doesObeyRules = (rules: rule[], event: Event): Error | null => {
  const start = new Date(event.start);
  const end = new Date(event.end);

  let explicitRules: ExplicitRule[] = mergeRules(
    toExplicitRules(rules, start, end),
  );
  for (const i in explicitRules) {
    if (breaksExplicitRule(explicitRules[i], event)) {
      return {
        sv: "Bokning bryter regel: " + explicitRules[i].title,
        en: "Booking breaks rule: " + explicitRules[i].title,
      };
    }
  }
  return null;
};

export const getRulesBetween = async (
  prisma: PrismaClient,
  from: Date,
  to: Date,
) => {
  return await prisma.rule.findMany({
    where: {
      end_date: {
        gte: from,
      },
      start_date: {
        lte: to,
      },
    },
  });
};

export const checkRules = async (prisma: PrismaClient, event: Event) => {
  const rules = await prisma.rule.findMany({
    where: {
      room: {
        hasSome: event.room,
      },
      end_date: {
        gte: new Date(event.start),
      },
      start_date: {
        lte: new Date(event.end),
      },
    },
  });
  return doesObeyRules(rules, event);
};

const validDate = (start: Date, end: Date): boolean => {
  return start.getTime() > 0 && end.getTime() > 0 && start < end;
};

export const createRule = async (
  prisma: PrismaClient,
  rule: Rule,
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
  if (!validDate(start_time, end_time)) {
    return {
      sv: "Ogiltig tid",
      en: "Invalid time",
    };
  }

  let res = await prisma.rule.create({
    data: {
      ...rule,
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
  prisma: PrismaClient,
  id: string,
  user: User,
): Promise<Error | null> => {
  const rule: dbRule | null = await prisma.rule.findUnique({
    where: { id: id },
  });
  if (!rule) {
    return {
      sv: "Kunde inte hitta regel",
      en: "Could not find rule",
    };
  }

  if (!user.is_admin) {
    return {
      sv: "Du har inte behörighet att radera regler",
      en: "You do not have permission to delete rules",
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
