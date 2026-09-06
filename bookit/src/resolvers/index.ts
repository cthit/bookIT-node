import { Tools } from "../utils/commonTypes";
import { getEventMResolvers, getEventQResolvers } from "./event.resolver";
import { getIllegalSlotsQResolvers } from "./illegal_slots.resolver";
import { getRuleMResolvers, getRuleQResolvers } from "./rule.resolver";
import { getUserQResolvers } from "./user.resolver";
import type { Resolvers } from "../generated/schema";

export const getResolvers = (tools: Tools) => {
  return {
    Event: {
      phone: (event, _args, { user }) =>
        user.is_admin || user.cid === event.booked_by ? (event.phone ?? "") : "",
    },
    User: { sid: () => null, jti: () => null },
    Query: {
      ...getUserQResolvers(),
      ...getEventQResolvers(tools),
      ...getRuleQResolvers(tools),
      ...getIllegalSlotsQResolvers(tools),
    },
    Mutation: {
      ...getEventMResolvers(tools),
      ...getRuleMResolvers(tools),
    },
  } satisfies Resolvers;
};
