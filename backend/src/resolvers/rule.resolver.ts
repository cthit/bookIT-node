import { Rule, User } from "../models";
import { createRule, deleteRule } from "../services/rule.service";
import { to } from "../utils";
import { Tools } from "../utils/commonTypes";

export const getRuleQResolvers = ({ prisma }: Tools) => ({
  rules: () => {
    return prisma.rule.findMany();
  },
  rule: (_: any, { id }: { id: string }) => {
    return prisma.rule.findUnique({
      where: {
        id: id,
      },
    });
  },
});

export const getRuleMResolvers = ({ prisma }: Tools) => ({
  createRule: async (
    _: any,
    { rule }: { rule: Rule },
    {user}: { user: User},
    ) => {
    return createRule(prisma, rule, user);
  },
  deleteRule: async (
    _: any,
     { id }: { id: string },
      {user}: { user: User},
     ) => {
      return deleteRule(prisma, id, user);
     },
});
