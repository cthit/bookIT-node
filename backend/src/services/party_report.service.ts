import pg from "pg";
import { PartyReport } from "../models";
import { to } from "../utils";
import * as partyReportRepo from "../repositories/party_report.repository";
import { Error } from "../models/error";
import { party_report, PrismaClient } from "@prisma/client";

export const getPartyReport = async (
  db: pg.Pool,
  id: string,
): Promise<PartyReport | null> => {
  const { res } = await to<pg.QueryResult<PartyReport>>(
    partyReportRepo.getPartyReport(db, id),
  );
  if (res && res.rowCount >= 0) {
    return res.rows[0];
  }
  return null;
};

export const createPartyReport = async (
  prisma: PrismaClient,
  party_report: PartyReport,
): Promise<string | null> => {
  let report = await prisma.party_report.create({
    data: <party_report>party_report,
  });
  return report.id;
};

export const deletePartyReport = async (
  db: pg.Pool,
  id: string,
): Promise<Error | null> => {
  const { err, res } = await to<pg.QueryResult>(
    partyReportRepo.deletePartyReport(db, id),
  );
  if (err || !res || res.rowCount < 0) {
    console.log(err);
    return {
      sv: "Misslyckades att ta bort gamla aktivitetsanmälan",
      en: "Failed to delete the old party report",
    };
  }
  return null;
};

export const editPartyReport = async (
  db: pg.Pool,
  party_report: PartyReport,
): Promise<Error | null> => {
  const { err, res } = await to<pg.QueryResult>(
    partyReportRepo.editPartyReport(db, party_report),
  );
  if (err || !res || res.rowCount < 0) {
    console.log(err);
    return {
      sv: "Misslyckades att uppdatera aktivitetsanmälan",
      en: "Failed to update party report",
    };
  }
  return null;
};
