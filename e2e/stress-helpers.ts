import type { Page } from "@playwright/test";
import { graphql } from "./booking-helpers";
import { stressData } from "./stress-data";

export async function populateStress(page: Page, concurrency = 6) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 6) {
    throw new Error("Concurrency must be 1–6");
  }
  const existing = await graphql<{
    events: { title: string; start: string }[];
    rules: { title: string; start_date: string }[];
  }>(page, "{ events { title start } rules { title start_date } }");
  const data = stressData();
  const existingEvents = new Set(existing.events.map((event) => `${event.title}|${event.start}`));
  const existingRules = new Set(
    existing.rules.map((rule) => `${rule.title}|${rule.start_date.slice(0, 10)}`),
  );
  const events = data.events.filter(
    (event) => !existingEvents.has(`${event.title}|${event.start}`),
  );
  const rules = data.rules.filter((rule) => !existingRules.has(`${rule.title}|${rule.start_date}`));
  const timings: number[] = [];

  for (let offset = 0; offset < events.length; offset += concurrency) {
    await Promise.all(
      events.slice(offset, offset + concurrency).map(async (event) => {
        const start = performance.now();
        const result = await graphql<{ createEvent: { en: string } | null }>(
          page,
          "mutation($event: InputEvent!) { createEvent(event: $event) { en } }",
          { event },
        );
        if (result.createEvent) throw new Error(`${event.title}: ${result.createEvent.en}`);
        timings.push(performance.now() - start);
      }),
    );
  }
  for (const rule of rules) {
    const result = await graphql<{ createRule: { en: string } | null }>(
      page,
      "mutation($rule: InputRule!) { createRule(rule: $rule) { en } }",
      { rule },
    );
    if (result.createRule) throw new Error(result.createRule.en);
  }
  timings.sort((a, b) => a - b);
  return {
    createdEvents: events.length,
    createdRules: rules.length,
    concurrency,
    writeP95Ms: timings[Math.floor(timings.length * 0.95)] ?? 0,
  };
}
