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

    return createEvent(
      prisma,
      { ...input, room: inputRooms(input.room), booked_by: user.cid },
      user,
    );
  },
  editEvent: async (
    _: unknown,
    { event }: { event?: InputEvent | null },
    { user }: { user: User },
  ) => {
    const input = requiredInput(event, "Booking");

    return editEvent(prisma, { ...input, room: inputRooms(input.room), booked_by: user.cid }, user);
  },
  moveEvent: async (_: unknown, move: BookingMove, { user }: { user: User }) => {
    return moveEvent(prisma, move, user);
  },
  deleteEvent: async (_: unknown, { id }: { id?: string | null }, { user }: { user: User }) => {
    return deleteEvent(prisma, requiredInput(id, "Booking id"), user);
  },
});
