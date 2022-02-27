import { Event } from "../models/event";
import { to, equal } from "../utils";
import pg from "pg";
import * as eventRepo from "../repositories/event.repository";
import { checkRules } from "./rule.service";
import {
  getPartyReport,
  createPartyReport,
  deletePartyReport,
  editPartyReport,
} from "./party_report.service";
import { User, Error } from "../models";
import { party_report, PrismaClient, event as p_event } from "@prisma/client";

const validEvent = async (
  prisma: PrismaClient,
  event: Event,
  groups: String[],
) => {
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

  let overlap_count = await prisma.event.count({
    where: {
      end: { gt: new Date(event.start) },
      start: { lte: new Date(event.end) },
      room: { hasSome: event.room.map(e => e.toString()) },
      id: { not: event.id },
    },
  });

  if (overlap_count > 0) {
    return {
      sv: "Den angivna tiden är upptagen",
      en: "The time slot is already taken",
    };
  }

  return null;
};

export const editEvent = async (
  prisma: PrismaClient,
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

  let old_event = await prisma.event.findFirst({
    where: { id: event.id },
  });
  if (!old_event) {
    console.log("Faild to get event with id: " + event.id);
    return {
      sv: "Kunde inte hämta gamla bokningen",
      en: "Failed to get event",
    };
  }

  let oldReport = null;

  if (old_event.party_report_id) {
    oldReport = await prisma.party_report.findFirst({
      where: { id: old_event.party_report_id },
    });
  }

  let err = await validEvent(prisma, event, groups);
  if (err) {
    return err;
  }

  err = await checkRules(db, event);
  if (err) {
    return err;
  }

  if (oldReport && !event.party_report && oldReport.id) {
    err = await deletePartyReport(db, oldReport.id);
    if (!err) return err;
    event.party_report_id = undefined;
  } else if (!oldReport && event.party_report) {
    let id = await createPartyReport(prisma, event.party_report);
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
    event.party_report
  ) {
    let { err } = await to(
      prisma.party_report.update({
        where: { id: oldReport.id },
        data: <party_report>event.party_report,
      }),
    );
    if (err) {
      console.log(err);
      return {
        sv: "Misslyckades att uppdatera aktivitiesanmälan",
        en: "Failed to update the party report",
      };
    }
    event.party_report_id = oldReport.id;
  } else {
    event.party_report_id = oldReport ? oldReport.id : undefined;
  }

  let res = await prisma.event.update({
    where: { id: event.id },
    data: {
      title: event.title,
      start: new Date(event.start),
      description: event.description,
      end: new Date(event.end),
      booked_as: event.booked_as,
      booked_by: event.booked_by ?? "",
      phone: event.phone,
      room: event.room.map(e => e.toString()),
      party_report_id: event.party_report_id,
    },
  });

  if (!res) {
    return {
      sv: "Misslyckades att uppdatera bokning",
      en: "Failed to update event",
    };
  }

  return null;
};

export const createEvent = async (
  prisma: PrismaClient,
  db: pg.Pool,
  event: Event,
  { groups }: User,
): Promise<Error | null> => {
  let err = await validEvent(prisma, event, groups);
  if (err) {
    return err;
  }

  err = await checkRules(db, event);
  if (err) {
    return err;
  }

  if (event.party_report) {
    let report = await prisma.party_report.create({
      data: <party_report>event.party_report,
    });
    if (!report) {
      return {
        sv: "Misslyckades att skapa aktivitetsanmälan",
        en: "Failed to create party report",
      };
    }
    event.party_report_id = report.id;
  }

  let res = await prisma.event.create({
    data: {
      title: event.title,
      start: new Date(event.start),
      description: event.description,
      end: new Date(event.end),
      booked_as: event.booked_as,
      booked_by: event.booked_by || "",
      phone: event.phone,
      room: event.room.map(e => e.toString()),
      party_report_id: event.party_report_id,
    },
  });

  if (!res) {
    return {
      sv: "Misslyckades att skapa bokning",
      en: "Failed to create event",
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
