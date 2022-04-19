import { Rule } from "../models";
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
  createRule: async (_: any, { rule }: { rule: Rule }) => {
    const { res, err } = await to(createRule(prisma, rule));
    if (err) {
      console.log(err);
    }
    return res;
  },
  deleteRule: async (_: any, { id }: { id: string }) => deleteRule(prisma, id),
});
