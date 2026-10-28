import { Tools } from "../utils/commonTypes";
import { getEventMResolvers, getEventQResolvers } from "./event.resolver";
import { getIllegalSlotsQResolvers } from "./illegal_slots.resolver";
import { getRuleMResolvers, getRuleQResolvers } from "./rule.resolver";
import { getUserQResolvers } from "./user.resolver";
import { bookedAsGroup, bookedByUser, superGroups } from "./gamma.resolver";
import type { Resolvers } from "../generated/schema";

export const getResolvers = (tools: Tools) => {
  return {
    Event: {
      phone: (event, _args, { user }) =>
        user.is_admin || user.sub === event.booked_by ? (event.phone ?? "") : "",
      booked_as_group: (event) => (event.booked_as ? bookedAsGroup(event.booked_as) : null),
      booked_by_user: (event) => (event.booked_by ? bookedByUser(event.booked_by) : null),
    },
    User: {
      sid: () => null,
      jti: () => null,
      super_groups: (user) => superGroups(user.groups),
    },
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
