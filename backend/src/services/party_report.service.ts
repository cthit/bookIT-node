import { PartyReport, Event } from "../models";
import { Error } from "../models/error";
import { party_report, PrismaClient } from "@prisma/client";
import { notify } from "./email_sender.service";
import { to } from "../utils";

export const getPartyReport = async (
  prisma: PrismaClient,
  id: string,
): Promise<PartyReport | null> => {
  return prisma.party_report.findUnique({
    where: {
      id: id,
    },
  });
};

export const createPartyReport = async (
  prisma: PrismaClient,
  party_report: PartyReport,
): Promise<string | null> => {
  let report = await prisma.party_report.create({
    data: <party_report>party_report,
  });
  return report.id;
};

export const deletePartyReport = async (
  prisma: PrismaClient,
  id: string,
): Promise<Error | null> => {
  await prisma.party_report.delete({
    where: {
      id: id,
    },
  });
  return null;
};

export const editPartyReport = async (
  prisma: PrismaClient,
  party_report: PartyReport,
): Promise<Error | null> => {
  if (!party_report.id) {
    return {
      sv: "Du måste ange id:t på aktivitetsanmälan som ska uppdateras",
      en: "You need to provide the id of the party report",
    };
  }

  await prisma.party_report.update({
    where: {
      id: party_report.id,
    },
    data: <party_report>party_report,
  });
  return null;
};

export const partyReportCreated = async (event: Event) => {
  let { err } = await to(
    notify({
      subject: "bookIT - Ny aktivitetsanmälan",
      body: `
    En ny aktivitestsanmälan har skapats i bookIT.
    Börjar: ${event.start}
    Slutar: ${event.end}
    Rum: ${event.room}

    Se anmälan här: https://bookit.chalmers.it/party_reports/${event.id}
    
    Mvh bookIT
    `,
    }),
  );

  if (err) {
    console.log("Failed to send email to VO");
    console.log(err.message);
  }
};
