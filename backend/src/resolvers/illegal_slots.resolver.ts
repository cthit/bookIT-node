import { Tools } from "../utils/commonTypes";
import {
  mergeRules,
  toExplicitRules,
  getRulesBetween,
} from "../services/rule.service";

export const getIllegalSlotsQResolvers = ({ prisma }: Tools) => ({
  illegalSlots: async (_: any, ft: { from: string; to: string }) => {
    const from = new Date(ft.from);
    const to = new Date(ft.to);

    const rules = await await getRulesBetween(prisma, from, to);

    return mergeRules(toExplicitRules(rules, from, to)).filter(
      rule => !rule.allow,
    );
  },
});
