import { Tools } from "../utils/commonTypes";
import { Event } from "../models/event";
import {
  getPartyReport,
  setPartyReportStatus,
} from "../services/party_report.service";
import { Error, User } from "../models";
import { to } from "../utils";

export const getPartyReportQResolvers = ({ prisma }: Tools) => ({
  // Where is this used???
  party_reports: (_: any) => {
    return prisma.party_report.findMany();
  },
  // Where is this used as well???
  party_report: async (_: any, { id }: { id: string }) => {
    return getPartyReport(prisma, id);
  },
});

export const getPartyReportMResolvers = ({ prisma }: Tools) => ({
  set_report_status: async (
    _: any,
    { status }: { status: { id: string; status: string } },
    { user }: { user: User },
  ): Promise<Error | null> => {
    if (!user.is_admin) {
      return {
        sv: "Åtkomst nekad: Du måste vara admin för att ändra status",
        en: "Permission denied: You must be admin to change status",
      };
    }

    const { err } = await to(
      setPartyReportStatus(prisma, status.id, status.status, user.language),
    );
    if (err) {
      return {
        sv: "Misslyckades att ändra status",
        en: "Failed to change status",
      };
    }
    return null;
  },
});

export const getPartyReportResolvers = ({ prisma }: Tools) => ({
  Event: {
    party_report: async ({ party_report_id }: Event, args: any) => {
      if (!party_report_id) {
        return null;
      }
      return getPartyReport(prisma, party_report_id);
    },
  },
});
