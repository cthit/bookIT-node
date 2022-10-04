import { PartyReport, Error, User } from "../models";
import { party_report, PrismaClient } from "@prisma/client";
import { to } from "../utils";
import { statusChanged } from "./email_sender.service";

export const validPartyReport = (party_report: PartyReport) => {
  if (!validPhoneNumber(party_report.responsible_number)) {
    return {
      sv: "Ogiltiga tecken i arransvarigs telefonnummer",
      en: "Illegal characters or faulty formatting of phone number",
    };
  }
  if (!validMail(party_report.responsible_email)) {
    return {
      sv: "Ogiltiga tecken i arransvarigs mailadress",
      en: "Illegal characters in event responsible e-mail",
    };
  }

  if (
    party_report.co_responsible_name ||
    party_report.co_responsible_email ||
    party_report.co_responsible_number
  ) {
    if (!validPhoneNumber(party_report.co_responsible_number)) {
      return {
        sv: "Ogiltiga tecken i medarransvarigs telefonnummer",
        en: "Illegal characters or faulty formatting of phone number",
      };
    }
    if (!validMail(party_report.co_responsible_email)) {
      return {
        sv: "Ogiltiga tecken i medarransvarigs mailadress",
        en: "Illegal characters in event responsible e-mail",
      };
    }

    if (party_report.status == "ACCEPTED") {
      return {
        sv: "Du kan inte ändra en godkänd bokning",
        en: "You can't edit an accepted booking",
      };
    }
  }
  return null;
};

const validPhoneNumber = (number: string | null) => {
  if (!number) return false;
  return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,5}$/im.test(
    number,
  )
    ? true
    : false;
};
const validMail = (mail: string | null) => {
  if (!mail) return false;
  return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)
    ? true
    : false;
};

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
): Promise<string> => {
  let err = validPartyReport(party_report);
  if (err) {
    throw err;
  }
  party_report.status = undefined;
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
  let err = validPartyReport(party_report);
  if (err) {
    return err;
  }
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

export const setPartyReportStatus = async (
  prisma: PrismaClient,
  id: string,
  status: string,
  language: string,
) => {
  await prisma.party_report.update({
    where: { id: id },
    data: { status: status },
  });

  const report = await prisma.party_report.findFirst({
    where: { id },
  });

  if (!report) {
    console.log("Error: No report found id: " + id);
    return;
  }

  const event = await prisma.event.findFirst({
    where: {
      party_report: {
        id: id,
      },
    },
  });

  if (!event) {
    console.log(
      "Error: No event found connected with party report with id: " + id,
    );
    return;
  }

  await statusChanged(event, report, status, language);
};
