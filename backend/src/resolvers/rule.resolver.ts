import { User } from "../models";
import type { InputRule } from "../generated/schema";
import { createRule, deleteRule } from "../services/rule.service";
import { Tools } from "../utils/commonTypes";
import { ruleResult } from "./serialize";

export const getRuleQResolvers = ({ prisma }: Tools) => ({
  rules: async () => {
    return (await prisma.rule.findMany()).map(ruleResult);
  },
  rule: async (_: unknown, { id }: { id: string }) => {
    const result = await prisma.rule.findUnique({
      where: {
        id: id,
      },
    });
    return result ? ruleResult(result) : null;
  },
});

export const getRuleMResolvers = ({ prisma }: Tools) => ({
  createRule: async (_: unknown, { rule }: { rule: InputRule }, { user }: { user: User }) => {
    return createRule(prisma, rule, user);
  },
  deleteRule: async (_: unknown, { id }: { id: string }, { user }: { user: User }) => {
    return deleteRule(prisma, id, user);
  },
});
