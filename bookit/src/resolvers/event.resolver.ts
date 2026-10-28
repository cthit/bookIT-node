import { Tools } from "../utils/commonTypes";
import type { InputEvent } from "../generated/schema";
import { User } from "../models/user";
import {
  createEvent,
  editEvent,
  deleteEvent,
  moveEvent,
  type BookingMove,
} from "../services/event.service";
import { eventResult } from "./serialize";
import { requiredInput, inputRooms } from "./input";
import { queryRange } from "../utils/date-range";
import { superGroup } from "../gamma/directory";

/**
 * Members may only book as their own groups, which the booking rules check.
 * Admins may book as any group, so a new group must be a real Gamma super
 * group ID. Keeping a booking's stored group needs no check, so editing works
 * while Gamma is down or after it removed the group.
 */
export async function bookingGroupError(
  bookedAs: string,
  user: User,
  storedGroup: string | null,
  lookup = superGroup,
) {
  // Members are limited to their own groups by the booking rules.
  if (!user.is_admin || bookedAs === storedGroup || user.groups.includes(bookedAs)) {
    return null;
  }

  try {
    if (await lookup(bookedAs)) {
      return null;
    }
  } catch {
    return {
      sv: "Kunde inte nå Gamma för att kontrollera gruppen. Försök igen senare.",
      en: "Could not reach Gamma to check the group. Try again later.",
    };
  }

  return { sv: "Okänd bokande grupp", en: "Unknown booking group" };
}

export const getEventQResolvers = ({ prisma }: Tools) => ({
  events: async (_: unknown, _args: unknown, { user }: { user: User }) => {
    return (await prisma.event.findMany()).map((event) => eventResult(event, user));
  },
  eventsFT: async (_: unknown, ft: { from: string; to: string }, { user }: { user: User }) => {
    const { from, to } = queryRange(ft.from, ft.to);

    return (
      await prisma.event.findMany({
        where: {
          end: { gte: from },
          start: { lte: to },
        },
      })
    ).map((event) => eventResult(event, user));
  },
  event: async (_: unknown, { id }: { id?: string | null }, { user }: { user: User }) => {
    const eventId = requiredInput(id, "Booking id");
    const result = await prisma.event.findFirst({
      where: { id: eventId },
    });

    return result ? eventResult(result, user) : null;
  },
});

export const getEventMResolvers = ({ prisma }: Tools) => ({
  createEvent: async (
    _: unknown,
    { event }: { event?: InputEvent | null },
    { user }: { user: User },
  ) => {
    const input = requiredInput(event, "Booking");
    const groupError = await bookingGroupError(input.booked_as, user, null);

    if (groupError) {
      return groupError;
    }

    return createEvent(
      prisma,
      { ...input, room: inputRooms(input.room), booked_by: user.sub },
      user,
    );
  },
  editEvent: async (
    _: unknown,
    { event }: { event?: InputEvent | null },
    { user }: { user: User },
  ) => {
    const input = requiredInput(event, "Booking");

    const stored = input.id
      ? await prisma.event.findUnique({ where: { id: input.id }, select: { booked_as: true } })
      : null;

    const groupError = await bookingGroupError(input.booked_as, user, stored?.booked_as ?? null);

    if (groupError) {
      return groupError;
    }

    return editEvent(prisma, { ...input, room: inputRooms(input.room), booked_by: user.sub }, user);
  },
  moveEvent: async (_: unknown, move: BookingMove, { user }: { user: User }) => {
    return moveEvent(prisma, move, user);
  },
  deleteEvent: async (_: unknown, { id }: { id?: string | null }, { user }: { user: User }) => {
    return deleteEvent(prisma, requiredInput(id, "Booking id"), user);
  },
});
