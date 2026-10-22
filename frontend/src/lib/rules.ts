import { format } from "date-fns";
import type { RulesQuery } from "@/generated/graphql";
import { parseDate } from "./dates";

export type RuleDetails = NonNullable<NonNullable<RulesQuery["rules"]>[number]>;

export const ruleWeekdays = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  sv: ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"],
};

export const ruleDateText = (value: string | null | undefined, withTime = false) =>
  value ? format(parseDate(value), withTime ? "d MMM yyyy, HH:mm" : "d MMM yyyy") : "—";

export const ruleDayText = (mask: number | null | undefined, language: "en" | "sv") =>
  ruleWeekdays[language].filter((_, index) => ((mask ?? 0) & (1 << index)) !== 0).join(" · ") ||
  "—";
