import { Event } from "../models/event";
import { checkRules } from "./rule.service";
import { User, Error } from "../models";
import { PrismaClient, event } from "@prisma/client";

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
    // 5443200000 = 63 days or 9 weeks
    return {
      sv: "Den angivna starttiden är för långt fram i tiden",
      en: "Start date is too far in the future",
    };
  }

  if (!groups.includes(event.booked_as) && !is_admin) {
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

  if (event.booked_as == event.booked_by && event.room.includes("BIG_HUB")) {
    return {
      sv: "Storhubben får inte bokas som privatperson",
      en: "The big hub cannot be booked as a private person",
    };
  }
  if (event.room.length <= 0) {
    return {
      sv: "Inget rum specificerat",
      en: "No room specified",
    };
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
    console.log("Failed to get event with id: " + event.id);
    return {
      sv: "Kunde inte hämta gamla bokningen",
      en: "Failed to get event",
    };
  }

  if (!(user.groups.includes(old_event.booked_as) || user.is_admin)) {
    return {
      sv: "Du har inte behörighet att redigera denna bokning",
      en: "You do not have permission to edit this event",
    };
  }
  // Updates event in the database
  let res = await prisma.event.update({
    where: { id: event.id },
    data: toEvent(event),
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

  await prisma.event.delete({
    where: {
      id: id,
    },
  });
  return null;
};
