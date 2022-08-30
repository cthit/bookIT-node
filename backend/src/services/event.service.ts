import { Event } from "../models/event";
import { to, equal, formatDT } from "../utils";
import { checkRules } from "./rule.service";
import {
  createPartyReport,
  deletePartyReport,
  editPartyReport,
  validPartyReport,
} from "./party_report.service";
import { User, Error } from "../models";
import {
  party_report,
  PrismaClient,
  event as p_event,
  prisma,
  event,
} from "@prisma/client";
import { eventUpdated, partyReportCreated } from "./email_sender.service";

const validEvent = async (
  prisma: PrismaClient,
  event: Event,

  { groups, is_admin }: User,
) => {
  if (new Date(event.start) >= new Date(event.end)) {
    return {
      sv: "Starttid är efter sluttid",
      en: "Start date is later than end date",
    };
  }

  if (new Date(event.start) > new Date(Date.now() + 5443200000) && !is_admin) {
    return {
      sv: "Den angivna starttiden är för långt fram i tiden",
      en: "Start date is too far in the future",
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
  if (event.party_report) {
    const err = validPartyReport(event.party_report);
    if (err) {
      return err;
    }
  }

  let query: any = {
    where: {
      end: { gt: new Date(event.start) },
      start: { lte: new Date(event.end) },
      room: { hasSome: event.room.map(e => e.toString()) },
    },
  };

  if (event.id) {
    query.where.id = { not: event.id };
  }

  let overlap_count = await prisma.event.count(query);

  if (overlap_count > 0) {
    return {
      sv: "Den angivna tiden är upptagen",
      en: "The time slot is already taken",
    };
  }

  if (!event.booking_terms) {
    return {
      sv: "Du måste godkänna bokningsvillkoren",
      en: "You must accept the booking terms and conditions",
    };
  }

  if (
    !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,5}$/im.test(
      event.phone,
    )
  ) {
    return {
      sv: "Ogiltigt telefonnummer",
      en: "Provided phone number is faulty",
    };
  }

  return null;
};

const toEvent = (event: Event) => ({
  title: event.title,
  start: new Date(event.start),
  description: event.description,
  end: new Date(event.end),
  booked_as: event.booked_as,
  booked_by: event.booked_by || "",
  phone: event.phone,
  room: event.room.map(e => e.toString()),
  party_report_id: event.party_report_id,
});

export const editEvent = async (
  prisma: PrismaClient,
  event: Event,
  user: User,
): Promise<Error | null> => {
  // Sanity checks
  if (event.id == null) {
    return {
      sv: "Inget boknings id",
      en: "No event id",
    };
  }

  let err = await validEvent(prisma, event, user);
  if (err) {
    return err;
  }

  err = await checkRules(prisma, event);
  if (err) {
    return err;
  }

  // Getting old event
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

  // Getting old party report
  let oldReport = null;
  if (old_event.party_report_id) {
    oldReport = await prisma.party_report.findFirst({
      where: { id: old_event.party_report_id },
    });
  }

  // If report has been deleted
  if (oldReport && oldReport.id && !event.party_report) {
    err = await deletePartyReport(prisma, oldReport.id);
    if (!err) return err;
    event.party_report_id = undefined;
  }
  // If report has been created
  else if (!oldReport && event.party_report) {
    let { res, err } = await to(createPartyReport(prisma, event.party_report));
    if (err || !res) {
      if (!(err instanceof Error)) {
        return err;
      }
      console.log(err);
      return {
        sv: "Kunde inte skapa aktivitetsanmälan",
        en: "Failed to create party report",
      };
    }
    await partyReportCreated(event);
    event.party_report_id = res;
  }
  // If the party report has been updated
  else if (
    !equal(oldReport, { ...event.party_report, id: oldReport?.id }) &&
    oldReport &&
    event.party_report
  ) {
    event.party_report.id = oldReport.id;
    event.party_report.status = oldReport.status;
    const err = await editPartyReport(prisma, event.party_report);

    if (err) {
      return err;
    }
    event.party_report_id = oldReport.id;
  }

  // Updates event in the database
  let res = await prisma.event.update({
    where: { id: event.id },
    data: toEvent(event),
  });

  // Notifies VO
  if (
    oldReport &&
    event.party_report_id === oldReport.id &&
    oldReport.status === "ACCEPTED"
  ) {
    await eventUpdated(
      <Event>{
        ...old_event,
        booking_terms: true,
        start: formatDT(old_event.start),
        end: formatDT(old_event.end),
        created_at: formatDT(old_event.created_at),
        updated_at: formatDT(old_event.updated_at),
      },
      event,
    );
  }

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
  event: Event,
  user: User,
): Promise<Error | null> => {
  // Sanity checks
  let err = await validEvent(prisma, event, user);
  if (err) {
    return err;
  }

  err = await checkRules(prisma, event);
  if (err) {
    return err;
  }

  // Create party report
  if (event.party_report) {
    let { res, err } = await to(
      createPartyReport(prisma, <party_report>event.party_report),
    );
    if (err || !res) {
      if (!(err instanceof Error)) {
        return err;
      }
      console.log(err);
      return {
        sv: "Misslyckades att skapa aktivitetsanmälan",
        en: "Failed to create party report",
      };
    }
    await partyReportCreated(event);
    event.party_report_id = res;
  }

  // Adds event in the database
  let res = await prisma.event.create({
    data: toEvent(event),
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
  prisma: PrismaClient,
  id: string,
  { groups, is_admin }: User,
) => {
  const event: event | null = await prisma.event.findUnique({
    where: {
      id: id,
    },
  });
  if (!event) {
    return {
      sv: "Kunde ej hitta bokningen",
      en: "Could not find the event",
    };
  }

  if (!groups.includes(event.booked_as) && !is_admin) {
    return {
      sv: "Du får ej radera denna bokning",
      en: "You may not delete this event",
    };
  }

  if (event.party_report_id) {
    await prisma.party_report.delete({
      where: {
        id: event.party_report_id,
      },
    });
  }

  await prisma.event.delete({
    where: {
      id: id,
    },
  });
  return null;
};
