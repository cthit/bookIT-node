import pg from "pg";
import { PartyReport } from "../models/party_report";

export const getPartyReport = (
  db: pg.Pool,
  id: string,
): Promise<pg.QueryResult<PartyReport>> =>
  db.query(
    "SELECT id, responsible_name, responsible_number, responsible_email, \
    co_responsible_name, co_responsible_number, co_responsible_email, \
    serving_permit, status FROM party_report WHERE id=$1",
    [id],
  );

export const getPartyReports = (
  db: pg.Pool,
): Promise<pg.QueryResult<PartyReport>> =>
  db.query(
    "SELECT id, responsible_name, responsible_number, responsible_email, \
    co_responsible_name, co_responsible_number, co_responsible_email, \
    serving_permit, status FROM party_report",
  );

export const createPartyReport = (
  db: pg.Pool,
  pr: PartyReport,
): Promise<pg.QueryResult<{ id: string }>> =>
  db.query(
    "INSERT INTO party_report (responsible_name, responsible_number,\
      responsible_email, co_responsible_name, co_responsible_number, \
      co_responsible_email, serving_permit) VALUES ($1, $2, $3, $4, $5, $6, $7)\
      RETURNING id",
    [
      pr.responsible_name,
      pr.responsible_number,
      pr.responsible_email,
      pr.co_responsible_name,
      pr.co_responsible_number,
      pr.co_responsible_email,
      pr.serving_permit,
    ],
  );

export const deletePartyReport = (
  db: pg.Pool,
  id: string,
): Promise<pg.QueryResult> =>
  db.query("DELETE FROM party_report WHERE id=$1", [id]);

export const editPartyReport = (
  db: pg.Pool,
  {
    id,
    responsible_email,
    responsible_name,
    responsible_number,
    co_responsible_email,
    co_responsible_name,
    co_responsible_number,
    serving_permit,
  }: PartyReport,
): Promise<pg.QueryResult> =>
  db.query(
    "UPDATE party_report SET\
  responsible_name = $1, responsible_number = $2,\
  responsible_email = $3, co_responsible_name = $4,\
  co_responsible_number = $5, co_responsible_email = $6,\
  serving_permit = $7 WHERE id=$8",
    [
      responsible_name,
      responsible_number,
      responsible_email,
      co_responsible_name,
      co_responsible_number,
      co_responsible_email,
      serving_permit,
      id,
    ],
  );
