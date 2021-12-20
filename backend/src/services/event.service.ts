import { Event } from "../models/event";
import { to, equal } from "../utils";
import pg from "pg";
import * as eventRepo from "../repositories/event.repository";
import { checkRules } from "./rule.service";
import {
  createPartyReport,
  deletePartyReport,
  editPartyReport,
} from "./party_report.service";
import { User, Error } from "../models";

const validEvent = async (db: pg.Pool, event: Event, groups: String[]) => {
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

  var { err, res } = await to<pg.QueryResult<Event>>(
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

  return null;
};

export const editEvent = async (
  db: pg.Pool,
  event: Event,
  { groups }: User,
) => {
  if (event.id == null) {
    return {
      sv: "Inget boknings id",
      en: "No event id",
    };
  }

  let { err, res } = await to(eventRepo.getEvent(db, event.id));
  if (err || !res || res.rowCount <= 0) {
    console.log("Faild to get event with id: " + event.id);
    return {
      sv: "Kunde inte hämta gamla bokningen",
      en: "Failed to get event",
    };
  }

  let oldReport = event.party_report;
  event = { ...res.rows[0], ...event };

  validEvent(db, event, groups);

  err = await checkRules(db, event);
  if (err) {
    return err;
  }

  if (oldReport && !event.party_report && oldReport.id) {
    err = await deletePartyReport(db, oldReport.id);
    if (!err) return err;
    event.party_report_id = undefined;
  } else if (!oldReport && event.party_report) {
    let id = await createPartyReport(db, event.party_report);
    if (!id) {
      return {
        sv: "Kunde inte skapa aktivitetsanmälan",
        en: "Failed to create party report",
      };
    }
    event.party_report_id = id;
  } else if (
    !equal(oldReport, event.party_report) &&
    oldReport &&
    oldReport.id
  ) {
    err = await editPartyReport(db, {
      ...oldReport,
      ...event.party_report,
      id: oldReport.id,
    });
    if (err) return err;
    event.party_report_id = oldReport.id;
  } else {
    event.party_report_id = oldReport ? oldReport.id : undefined;
  }

  {
    let { err, res } = await to<pg.QueryResult<Event>>(
      eventRepo.editEvent(db, event),
    );
    if (err || !res || res.rowCount <= 0) {
      console.log(err);
      return {
        sv: "Misslyckades att uppdatera bokningen",
        en: "Failed to update the event",
      };
    }
  }

  return null;
};

export const createEvent = async (
  db: pg.Pool,
  event: Event,
  { groups }: User,
): Promise<Error | null> => {
  validEvent(db, event, groups);
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

export const deleteEvent = async (
  db: pg.Pool,
  id: string,
  { groups, is_admin }: User,
) => {
  const mayDelete = (group: string) => groups.includes(group) || is_admin;
  const { res, err } = await to(eventRepo.deleteEvent(db, id, mayDelete));
  if (err) {
    console.log(err);
    return {
      sv: "Misslyckades att radera bokningen",
      en: "Failed to delete the booking",
    };
  }
  return res;
};
