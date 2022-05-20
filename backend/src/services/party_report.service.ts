import { PartyReport, User } from "../models";
import { Error } from "../models/error";
import { party_report, PrismaClient } from "@prisma/client";

export const getPartyReport = async (
  prisma: PrismaClient,
  id: string,
  user: User | null,
): Promise<PartyReport | null> => {
  const report = await prisma.party_report.findUnique({
    where: {
      id: id,
    },
  });
  if (!report) {
    return null;
  }
  else if (user?.is_admin) {
    return report;
  }
  else {
    return {
      id: null,
      responsible_name: report.responsible_name,
      responsible_number: "",
      responsible_email: "",
      co_responsible_name: null,
      co_responsible_number: null,
      co_responsible_email: null,
      serving_permit: null,
      status: null
    };
  }
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
