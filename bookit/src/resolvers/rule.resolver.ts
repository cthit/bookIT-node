import { User } from "../models";
import type { InputRule } from "../generated/schema";
import { createRule, deleteRule } from "../services/rule.service";
import { Tools } from "../utils/commonTypes";
import { requiredInput, inputRooms } from "./input";
import { ruleResult } from "./serialize";

export const getRuleQResolvers = ({ prisma }: Tools) => ({
  rules: async () => {
    return (await prisma.rule.findMany()).map(ruleResult);
  },
  rule: async (_: unknown, { id }: { id?: string | null }) => {
    const ruleId = requiredInput(id, "Rule id");
    const result = await prisma.rule.findUnique({
      where: {
        id: ruleId,
      },
    });

    return result ? ruleResult(result) : null;
  },
});

export const getRuleMResolvers = ({ prisma }: Tools) => ({
  createRule: async (
    _: unknown,
    { rule }: { rule?: InputRule | null },
    { user }: { user: User },
  ) => {
    const input = requiredInput(rule, "Rule");

    return createRule(prisma, { ...input, room: inputRooms(input.room) }, user);
  },
  deleteRule: async (_: unknown, { id }: { id?: string | null }, { user }: { user: User }) => {
    return (await deleteRule(prisma, requiredInput(id, "Rule id"), user)) === null;
  },
});
