import { Tools } from "../utils/commonTypes";
import type { InputEvent } from "../generated/schema";
import { User } from "../models/user";
import { createEvent, editEvent, deleteEvent } from "../services/event.service";
import { eventResult } from "./serialize";

export const getEventQResolvers = ({ prisma }: Tools) => ({
  events: async () => {
    return (await prisma.event.findMany()).map(eventResult);
  },
  eventsFT: async (_: unknown, ft: { from: string; to: string }) => {
    return (
      await prisma.event.findMany({
        where: {
          end: { gte: new Date(ft.from) },
          start: { lte: new Date(ft.to) },
        },
      })
    ).map(eventResult);
  },
  event: async (_: unknown, { id }: { id: string }) => {
    const result = await prisma.event.findFirst({
      where: { id: id },
    });
    return result ? eventResult(result) : null;
  },
});

export const getEventMResolvers = ({ prisma }: Tools) => ({
  createEvent: async (_: unknown, { event }: { event: InputEvent }, { user }: { user: User }) => {
    return createEvent(prisma, { ...event, booked_by: user.cid }, user);
  },
  editEvent: async (_: unknown, { event }: { event: InputEvent }, { user }: { user: User }) => {
    return editEvent(prisma, { ...event, booked_by: user.cid }, user);
  },
  deleteEvent: async (_: unknown, { id }: { id: string }, { user }: { user: User }) => {
    return deleteEvent(prisma, id, user);
  },
});
