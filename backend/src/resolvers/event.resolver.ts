import { to } from "../utils";
import { Tools } from "../utils/commonTypes";
import { Event } from "../models/event";
import { User } from "../models/user";
import { createEvent, editEvent, deleteEvent } from "../services/event.service";

export const getEventQResolvers = ({ prisma }: Tools) => ({
  events: async () => {
    return await prisma.event.findMany();
  },
  eventsFT: async (_: any, ft: { from: string; to: string }) => {
    return await prisma.event.findMany({
      where: {
        end: { gte: new Date(ft.from) },
        start: { lte: new Date(ft.to) },
      },
    });
  },
  event: async (_: any, { id }: { id: string }) => {
    return await prisma.event.findFirst({
      where: { id: id },
    });
  },
  party_events: async () => {
    return await prisma.event.findMany({
      where: { party_report_id: { not: null } },
    });
  },
});

export const getEventMResolvers = ({ prisma }: Tools) => ({
  createEvent: async (
    _: any,
    { event }: { event: Event },
    { user }: { user: User },
  ) => {
    event.booked_by = user.cid;
    return createEvent(prisma, event, user);
  },
  editEvent: async (
    _: any,
    { event }: { event: Event },
    { user }: { user: User },
  ) => {
    event.booked_by = user.cid;
    return editEvent(prisma, event, user);
  },
  deleteEvent: async (
    _: any,
    { id }: { id: string },
    { user }: { user: User },
  ) => {
    return deleteEvent(prisma, id, user);
  },
});
