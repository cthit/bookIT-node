import { Event } from "../models/event";
import { to } from "../utils";
import pg from "pg";
import * as eventRepo from "../repositories/event.repository";
import { checkRules } from "./rule.service";
import { createPartyReport } from "./party_report.service";
import { User, Error } from "../models";

export const createEvent = async (
  db: pg.Pool,
  event: Event,
  { groups }: User,
): Promise<Error | null> => {
  if (new Date(event.start) >= new Date(event.end)) {
    return {
      sv: "Starttid är efter sluttid",
      en: "Start date is later than end date",
    };
  }

  if (!groups.includes(event.booked_as)) {
    return {
      sv: "Bokande grupp ej specificerad",
      en: "Booking group not specified",
    };
  }

  if (!event.booked_by || event.booked_by == "") {
    return {
      sv: "Bokande användare ej specificerad",
      en: "Booking user not specified",
    };
  }

  if (event.room.length <= 0) {
    return {
      sv: "Inget rum specificerat",
      en: "No room specified",
    };
  }

  var { err, res } = await to<pg.QueryResult<Event[]>>(
    eventRepo.getOverlapEvent(db, event),
  );
  if (err) {
    console.log(err);
    return {
      sv: "Databas error",
      en: "Database error",
    };
  }

  if (!res || res?.rowCount > 0) {
    return {
      sv: "Den angivna tiden är upptagen",
      en: "The time slot is already taken",
    };
  }

  err = await checkRules(db, event);
  if (err) {
    return err;
  }

  if (event.party_report) {
    const id = await createPartyReport(db, event.party_report);
    if (!id) {
      return {
        sv: "Misslyckades att skapa aktivitetsanmälan",
        en: "Failed to create party report",
      };
    }
    event.party_report_id = id;
  }

  var { err } = await to<pg.QueryResult<any>>(eventRepo.createEvent(db, event));
  if (err) {
    console.log(err);
    return {
      sv: "Databas error",
      en: "Database error",
    };
  }
  return null;
};
