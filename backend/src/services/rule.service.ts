import { Event, Rule, Error, User } from "../models";
import { to } from "../utils";
import { PrismaClient, rule } from "@prisma/client";

const ms_24H = 86400000; // == 1000 * 60 * 60 * 24

export interface MiniRule {
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

/**
 * Creates a list of time slots where each rule apply
 */
export const toMiniRules = (
  rules: rule[],
  from: Date,
  to: Date,
): MiniRule[] => {
  const miniRules: MiniRule[] = [];
  for (const rule_i in rules) {
    var current = new Date(from);
    const end = new Date(rules[rule_i].end_date);
    while (true) {
      if (dayApplies(current, rules[rule_i].day_mask))
        miniRules.push({
          start: new Date(day(current) + "T" + rules[rule_i].start_time),
          end: new Date(day(current) + "T" + rules[rule_i].end_time),
          ...rules[rule_i],
        });
      if (!sameDay(current, to) && !sameDay(current, end)) {
        current = new Date(current.getTime() + ms_24H);
      } else {
        break;
      }
    }
  }
  return miniRules.sort((a, b): number => a.priority - b.priority);
};

export const mergeRules = (rules: MiniRule[]): MiniRule[] => {
  var mergedRules: MiniRule[] = [];
  const insert = (rule: MiniRule, [x, ...xs]: MiniRule[]): MiniRule[] => {
    if (rule.start >= rule.end) return [];
    if (x == undefined) return [rule];
    if (x.start > rule.start) {
      if (x.start >= rule.end) return [rule, x, ...xs];
      return [
        { ...rule, end: new Date(x.start) },
        ...insert({ ...rule, start: new Date(x.end) }, [x, ...xs]),
      ];
    }
    if (x.end > rule.start)
      return [x, ...insert({ ...rule, start: x.end }, xs)];
    return [x, ...insert(rule, xs)];
  };
  for (const i in rules) {
    mergedRules = insert(rules[i], mergedRules);
  }
  return mergedRules;
};

const doesObeyRules = (rules: rule[], event: Event): Error | null => {
  const start = new Date(event.start);
  const end = new Date(event.end);

  var mr: MiniRule[] = mergeRules(toMiniRules(rules, start, end));
  for (const i in mr) {
    if (mr[i].start < end && mr[i].end > start && !mr[i].allow) {
      return {
        sv: "Bokning bryter regel: " + mr[i].title,
        en: "Booking breaks rule: " + mr[i].title,
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

export const createRule = async (
  prisma: PrismaClient,
  rule: Rule,
  {groups, is_admin}: User,
): Promise<Error| null> => {
  const start = new Date(rule.start_date);
  const end = new Date(rule.end_date);
  if (!start.valueOf() || !end.valueOf() || start >= end) {
    return {
      sv: "Ogiltigt datum",
      en: "Invalid date",
    };
  }
  rule.start_date = day(start);
  rule.end_date = day(end);

  const start_time = new Date(rule.start_date + "T" + rule.start_time);
  const end_time = new Date(rule.start_date + "T" + rule.end_time);
  if (!start_time.valueOf() || !end_time.valueOf() || start_time >= end_time) {
    return {
      sv: "Ogiltig tid",
      en: "Invalid time",
    };
    }
  if (!(is_admin) && !groups.includes("P.R.I.T")) {
    return {
      sv: "Du har inte behörighet att skapa regler",
      en: "You do not have permission to create rules",
    };
  }
  console.log("creating rule");
  let res = await prisma.rule.create({
    data: {
      ...rule,
      start_date: new Date(rule.start_date),
      end_date: new Date(rule.end_date),
    },
  });
  if (!res){
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
): Promise<Boolean> => {
  const { err, res } = await to(
    prisma.rule.delete({
      where: {
        id: id,
      },
    }),
  );
  if (err) {
    console.log(err);
    return false;
  }
  return true;
};
