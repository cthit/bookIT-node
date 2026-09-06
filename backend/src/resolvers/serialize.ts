import type { event, rule } from "@prisma/client";
import type { Event, Rule, Room } from "../generated/schema";
import type { ExplicitRule } from "../services/rule.service";

export function eventResult(value: event): Event {
  return {
    ...value,
    start: value.start.toISOString(),
    end: value.end.toISOString(),
    created_at: value.created_at.toISOString(),
    updated_at: value.updated_at.toISOString(),
    room: value.room as Room[],
  };
}

export function ruleResult(value: rule): Rule {
  return {
    ...value,
    start_date: value.start_date.toISOString(),
    end_date: value.end_date.toISOString(),
    created_at: value.created_at.toISOString(),
    updated_at: value.updated_at.toISOString(),
  };
}

export function slotResult(value: ExplicitRule) {
  return { ...value, start: value.start.toISOString(), end: value.end.toISOString() };
}
