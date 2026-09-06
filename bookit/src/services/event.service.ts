import { Prisma, PrismaClient, event, room } from "@prisma/client";
import { Error, User } from "../models";
import type { InputEvent } from "../generated/schema";
import { checkRules } from "./rule.service";
import { setTimeout as delay } from "node:timers/promises";
import { MAX_RANGE_DAYS, validRange } from "../utils/date-range";

type Event = Omit<InputEvent, "room"> & { room: room[]; booked_by: string };

/*
 * Events must end after they start
 */
const endIsAfterStart = (event: Event) => {
  return new Date(event.start) < new Date(event.end);
};

/**
 * Users cannot book events more than 9 weeks in advance
 * Admins are exempt from this rule
 */
const isWithin9Weeks = (event: Event, is_admin: boolean) => {
  return new Date(event.start) <= new Date(Date.now() + 5443200000) || is_admin;
};

/*
 * Users must be in a booking group to book a room
 * Admins are exempt from this rule
 */
const userIsInBookingGroup = (event: Event | event, user: User) => {
  return user.groups.includes(event.booked_as) || user.is_admin;
};

/**
 * The person booking the event must be specified
 */
const bookedByIsSpecified = (event: Event) => {
  return event.booked_by && event.booked_by != "";
};

/**
 * Big hub and The Cloud cannot be booked for a private event
 */
const bookingImportantAsPrivate = (event: Event) => {
  return (
    event.booked_as == event.booked_by &&
    (event.room.includes(room.BIG_HUB) || event.room.includes(room.THE_CLOUD))
  );
};

const roomSpecified = (event: Event) => {
  return event.room.length > 0;
};

/**
 * The new event may not overlap with any existing events
 */
const overlappingEvent = async (
  prisma: Prisma.TransactionClient,
  event: Event,
): Promise<boolean> => {
  const query: Prisma.eventCountArgs = {
    where: {
      end: { gt: new Date(event.start) },
      start: { lt: new Date(event.end) },
      room: { hasSome: event.room.map((e) => e.toString()) },
    },
  };

  if (event.id && query.where) {
    query.where.id = { not: event.id };
  }

  let overlap_count = await prisma.event.count(query);

  return overlap_count > 0;
};

/**
 * Booking terms and conditions must be accepted
 */
const bookingTermsAccepted = (event: Event) => {
  return event.booking_terms;
};

const validPhoneNumber = (phoneNumber: string | null | undefined) => {
  return (
    typeof phoneNumber === "string" &&
    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,5}$/.test(phoneNumber)
  );
};

const validEvent = async (
  prisma: Prisma.TransactionClient,
  event: Event,

  user: User,
) => {
  if (!endIsAfterStart(event)) {
    return {
      sv: "Starttid är efter sluttid",
      en: "Start date is later than end date",
    };
  }

  if (!validRange(new Date(event.start), new Date(event.end))) {
    return {
      sv: `En bokning får vara högst ${MAX_RANGE_DAYS} dagar lång`,
      en: `A booking may last at most ${MAX_RANGE_DAYS} days`,
    };
  }

  if (!isWithin9Weeks(event, user.is_admin)) {
    // 5443200000 = 63 days or 9 weeks
    return {
      sv: "Den angivna starttiden är för långt fram i tiden",
      en: "Start date is too far in the future",
    };
  }

  if (!event.booked_as.trim() || !userIsInBookingGroup(event, user)) {
    return {
      sv: "Bokande grupp ej specificerad",
      en: "Booking group not specified",
    };
  }

  if (!bookedByIsSpecified(event)) {
    return {
      sv: "Bokande användare ej specificerad",
      en: "Booking user not specified",
    };
  }

  if (bookingImportantAsPrivate(event)) {
    return {
      sv: "Storhubben och The Cloud får inte bokas som privatperson",
      en: "The big hub and The Cloud cannot be booked as a private person",
    };
  }

  if (!roomSpecified(event)) {
    return {
      sv: "Inget rum specificerat",
      en: "No room specified",
    };
  }

  try {
    if (await overlappingEvent(prisma, event)) {
      return {
        sv: "Den angivna tiden är upptagen",
        en: "The time slot is already taken",
      };
    }
  } catch (e) {
    if (isSerializationFailure(e)) {
      throw e;
    }

    console.log(e);

    return {
      sv: "Kunde inte kontrollera överlappande bokningar",
      en: "Failed to check for overlapping events",
    };
  }

  if (!bookingTermsAccepted(event)) {
    return {
      sv: "Du måste godkänna bokningsvillkoren",
      en: "You must accept the booking terms and conditions",
    };
  }

  if (!validPhoneNumber(event.phone)) {
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
  phone: event.phone ?? "",
  room: event.room.map((e) => e.toString()),
});

const isSerializationFailure = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
    return true;
  }

  // Driver-adapter commit failures can bypass Prisma's P2034 wrapper.
  return (
    error instanceof globalThis.Error &&
    error.name === "DriverAdapterError" &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "kind" in error.cause &&
    error.cause.kind === "TransactionWriteConflict"
  );
};

// Retry availability checks and writes together after serialization conflicts.
const withBookingTransaction = async (
  prisma: PrismaClient,
  operation: (transaction: Prisma.TransactionClient) => Promise<Error | null>,
): Promise<Error | null> => {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 10_000,
      });
    } catch (error) {
      if (!isSerializationFailure(error)) {
        throw error;
      }

      if (attempt + 1 < maxAttempts) {
        await delay(20 * 2 ** attempt + Math.random() * 30);
      }
    }
  }

  return {
    sv: "Bokningen ändrades samtidigt. Försök igen.",
    en: "A booking changed concurrently. Please try again.",
  };
};

export const editEvent = async (
  prisma: PrismaClient,
  event: Event,
  user: User,
): Promise<Error | null> => {
  if (event.id == null) {
    return {
      sv: "Inget boknings id angivet",
      en: "No event id specified",
    };
  }

  const id = event.id;

  return withBookingTransaction(prisma, async (transaction) => {
    const previous = await transaction.event.findUnique({ where: { id } });

    if (!previous) {
      return { sv: "Kunde inte hämta gamla bokningen", en: "Failed to get event" };
    }

    if (!userIsInBookingGroup(previous, user)) {
      return {
        sv: "Du har inte behörighet att redigera denna bokning",
        en: "You do not have permission to edit this event",
      };
    }

    if (
      previous.booked_by &&
      previous.booked_by !== user.cid &&
      !user.is_admin &&
      event.phone != null
    ) {
      return {
        sv: "Endast kontaktpersonen eller en administratör får ändra telefonnumret",
        en: "Only the contact owner or an administrator may change the phone number",
      };
    }

    // Keeping a hidden number must also keep its owner. An anonymized booking
    // needs a new contact, whose number is validated below.
    const updated = {
      ...event,
      phone: event.phone ?? (previous.booked_by ? previous.phone : ""),
      booked_by: previous.booked_by || user.cid,
    };

    const error =
      (await validEvent(transaction, updated, user)) || (await checkRules(transaction, updated));

    if (error) {
      return error;
    }

    await transaction.event.update({ where: { id }, data: toEvent(updated) });

    return null;
  });
};

export interface BookingMove {
  id: string;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
}

export const moveEvent = async (
  prisma: PrismaClient,
  move: BookingMove,
  user: User,
): Promise<Error | null> => {
  return withBookingTransaction(prisma, async (transaction) => {
    const previous = await transaction.event.findUnique({ where: { id: move.id } });

    if (!previous) {
      return { sv: "Kunde inte hämta gamla bokningen", en: "Failed to get event" };
    }

    if (!userIsInBookingGroup(previous, user)) {
      return {
        sv: "Du har inte behörighet att redigera denna bokning",
        en: "You do not have permission to edit this event",
      };
    }

    if (
      previous.start.getTime() !== Date.parse(move.previousStart) ||
      previous.end.getTime() !== Date.parse(move.previousEnd)
    ) {
      return {
        sv: "Bokningens tid har ändrats. Ladda om kalendern och försök igen.",
        en: "The booking time has changed. Reload the calendar and try again.",
      };
    }

    const updated: Event = {
      ...previous,
      start: move.start,
      end: move.end,
      room: previous.room as room[],
      booking_terms: true,
      created_at: previous.created_at.toISOString(),
      updated_at: previous.updated_at.toISOString(),
    };

    const error =
      (await validEvent(transaction, updated, user)) || (await checkRules(transaction, updated));

    if (error) {
      return error;
    }

    await transaction.event.update({
      where: { id: move.id },
      data: { start: new Date(move.start), end: new Date(move.end) },
    });

    return null;
  });
};

export const createEvent = async (
  prisma: PrismaClient,
  event: Event,
  user: User,
): Promise<Error | null> => {
  if (event.id != null) {
    return {
      sv: "Nya bokningar får inte ange ett befintligt boknings-id",
      en: "New bookings must not specify an existing booking ID",
    };
  }

  return withBookingTransaction(prisma, async (transaction) => {
    const error =
      (await validEvent(transaction, event, user)) || (await checkRules(transaction, event));

    if (error) {
      return error;
    }

    await transaction.event.create({ data: toEvent(event) });

    return null;
  });
};

export const deleteEvent = async (prisma: PrismaClient, id: string, user: User) => {
  return withBookingTransaction(prisma, async (transaction) => {
    const event: event | null = await transaction.event.findUnique({
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

    if (!userIsInBookingGroup(event, user)) {
      return {
        sv: "Du får ej radera denna bokning",
        en: "You may not delete this event",
      };
    }

    await transaction.event.delete({
      where: {
        id: id,
      },
    });

    return null;
  });
};
