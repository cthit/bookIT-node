import { PartyReport } from "../models";
import { Error } from "../models/error";
import { party_report, PrismaClient } from "@prisma/client";

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
