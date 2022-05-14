import { Tools } from "../utils/commonTypes";
import {
  mergeRules,
  toMiniRules,
  getRulesBetween,
} from "../services/rule.service";

export const getIllegalSlotsQResolvers = ({ prisma }: Tools) => ({
  illegalSlots: async (_: any, ft: { from: string; to: string }) => {
    const from = new Date(ft.from);
    const to = new Date(ft.to);

    const rules = await (await getRulesBetween(prisma, from, to)).filter(rule => !rule.allow);

    return mergeRules(toMiniRules(rules, from, to));
  },
});
