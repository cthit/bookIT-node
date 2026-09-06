import { Tools } from "../utils/commonTypes";
import { room } from "@prisma/client";
import { slotResult } from "./serialize";
import { mergeRules, toExplicitRules, getRulesBetween } from "../services/rule.service";

export const getIllegalSlotsQResolvers = ({ prisma }: Tools) => ({
  illegalSlots: async (_: unknown, ft: { from: string; to: string }) => {
    const from = new Date(ft.from);
    const to = new Date(ft.to);

    const rules = await getRulesBetween(prisma, from, to);

    return Object.values(room).flatMap((selectedRoom) =>
      mergeRules(
        toExplicitRules(
          rules.filter((rule) => rule.room.includes(selectedRoom)),
          from,
          to,
        ),
      )
        .filter((rule) => !rule.allow)
        .map((rule) => ({ ...slotResult(rule), room: [selectedRoom] })),
    );
  },
});
