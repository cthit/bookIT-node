import { Tools } from "../utils/commonTypes";
import { getEventMResolvers, getEventQResolvers } from "./event.resolver";
import { getIllegalSlotsQResolvers } from "./illegal_slots.resolver";
import {
  getPartyReportMResolvers,
  getPartyReportQResolvers,
  getPartyReportResolvers,
} from "./party_report.resolver";
import { getRuleMResolvers, getRuleQResolvers } from "./rule.resolver";
import { getUserQResolvers } from "./user.resolver";

export const getResolvers = (tools: Tools) => {
  return {
    Query: {
      ...getUserQResolvers(),
      ...getEventQResolvers(tools),
      ...getPartyReportQResolvers(tools),
      ...getRuleQResolvers(tools),
      ...getIllegalSlotsQResolvers(tools),
    },
    Mutation: {
      ...getEventMResolvers(tools),
      ...getRuleMResolvers(tools),
      ...getPartyReportMResolvers(tools),
    },
    ...getPartyReportResolvers(tools),
  };
};
