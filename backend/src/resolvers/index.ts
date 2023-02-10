import { Tools } from "../utils/commonTypes";
import {
  getAPIKeysMResolvers,
  getAPIKeysQResolvers,
} from "./api-keys.resolver";
import { getEventMResolvers, getEventQResolvers } from "./event.resolver";
import { getIllegalSlotsQResolvers } from "./illegal_slots.resolver";
import { getRuleMResolvers, getRuleQResolvers } from "./rule.resolver";
import { getUserQResolvers } from "./user.resolver";

export const getResolvers = (tools: Tools) => {
  return {
    Query: {
      ...getUserQResolvers(),
      ...getEventQResolvers(tools),
      ...getRuleQResolvers(tools),
      ...getIllegalSlotsQResolvers(tools),
      ...getAPIKeysQResolvers(tools),
    },
    Mutation: {
      ...getEventMResolvers(tools),
      ...getRuleMResolvers(tools),
      ...getAPIKeysMResolvers(tools),
    },
  };
};
