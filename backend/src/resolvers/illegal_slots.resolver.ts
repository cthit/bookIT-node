import { Tools } from "../utils/commonTypes";
import { mergeRules, toMiniRules, MiniRule } from "../services/rule.service";

export const getIllegalSlotsQResolvers = ({ prisma }: Tools) => ({
  illegalSlots: async (_: any, ft: { from: string; to: string }) => {
    const from = new Date(ft.from);
    const to = new Date(ft.to);

    const rules = await prisma.rule.findMany({
      where: {
        end_date: {
          gte: from,
        },
        start_date: {
          lte: to,
        },
      },
    });

    return mergeRules(toMiniRules(rules, from, to));
  },
});
