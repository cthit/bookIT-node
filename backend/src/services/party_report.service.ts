import pg from "pg";
import { PartyReport } from "../models";
import { to } from "../utils";
import * as partyReportRepo from "../repositories/party_report.repository";
import { Error } from "../models/error";

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
  db: pg.Pool,
  party_report: PartyReport,
): Promise<string | null> => {
  const { err, res } = await to<pg.QueryResult<{ id: string }>>(
    partyReportRepo.createPartyReport(db, party_report),
  );
  if (err) {
    console.log(err);
    return null;
  }
  return res && res.rows[0] ? res.rows[0].id : null;
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
