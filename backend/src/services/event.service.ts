import { Event } from "../models/event";
import { to } from "../utils";
import pg from "pg";
import * as eventRepo from "../repositories/event.repository";
import { checkRules } from "./rule.service";
import { createPartyReport } from "./party_report.service";
import { User } from "../models/user";

export const createEvent = async (
  db: pg.Pool,
  event: Event,
  { groups }: User,
): Promise<boolean> => {
  if (new Date(event.start) >= new Date(event.end)) {
    return false;
  }

  if (!groups.includes(event.booked_as)) {
    return false;
  }

  if (!event.booked_by || event.booked_by == "") {
    return false;
  }

  if (event.room.length <= 0) {
    return false;
  }

  var { err, res } = await to<pg.QueryResult<Event[]>>(
    eventRepo.getOverlapEvent(db, event),
  );
  if (err) {
    console.log(err);
    return false;
  }

  if (!res || res?.rowCount > 0) {
    return false;
  }

  if ((await checkRules(db, event)) !== "") {
    //TODO: Return error string instead of bool
    return false;
  }

  if (event.party_report) {
    const id = await createPartyReport(db, event.party_report);
    if (!id) {
      return false;
    }
    event.party_report_id = id;
  }

  var { err } = await to<pg.QueryResult<any>>(eventRepo.createEvent(db, event));
  if (err) {
    console.log(err);
    return false;
  }
  return true;
};
