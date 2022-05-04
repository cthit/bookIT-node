import { Tools } from "../utils/commonTypes";
import { Event } from "../models/event";
import { getPartyReport } from "../services/party_report.service";
import { User } from "../models";

export const getPartyReportQResolvers = ({ prisma }: Tools) => ({
  party_reports: () => {
    return prisma.party_report.findMany();
  },
  party_report: async (_: any, { id }: { id: string }) => {
    return getPartyReport(prisma, id,null);
  },
});

export const getPartyReportResolvers = ({ prisma }: Tools) => ({
  Event: {
    party_report: async ({ party_report_id }: Event, args: any,{user}:{user:User}) => {
      if (!party_report_id) {
        return null;
      }
      return getPartyReport(prisma, party_report_id,user);
    },
  },
});
