import * as events from "../repositories/event.repository";
import { to } from "../utils";
import { Tools } from "../utils/commonTypes";
import { Event } from "../models/event";
import { User } from "../models/user";
import pg from "pg";
import { createEvent, editEvent, deleteEvent } from "../services/event.service";

export const getEventQResolvers = ({ db, prisma }: Tools) => ({
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

export const getEventMResolvers = ({ db, prisma }: Tools) => ({
  createEvent: async (
    _: any,
    { event }: { event: Event },
    { user }: { user: User },
  ) => {
    event.booked_by = user.cid;
    return createEvent(prisma, db, event, user);
  },
  editEvent: async (
    _: any,
    { event }: { event: Event },
    { user }: { user: User },
  ) => {
    return editEvent(prisma, db, event, user);
  },
  deleteEvent: async (
    _: any,
    { id }: { id: string },
    { user }: { user: User },
  ) => {
    return deleteEvent(db, id, user);
  },
});
