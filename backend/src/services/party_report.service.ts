import { PartyReport } from "../models";
import { Error } from "../models/error";
import { party_report, PrismaClient } from "@prisma/client";

export const validPartyReport=(
  party_report: PartyReport,
) =>{
  console.log("hej");
  if(!(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,5}$/im.test(party_report.responsible_number))){
    return{
      sv: "Arransvarigs telefonnummer är ogiltigt",
      en: "responsible_number is faulty",
    };
  }
  if(!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(party_report.responsible_email))){
    return {
      sv: "Ogiltiga tecken i arransvarigs mailadress",
      en: "responsible_email contains faulty characters",
    };
  }
  return null;
}

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
): Promise<string | null > => {
  let err=validPartyReport(party_report);
  if(err){
    return null;
  }
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
  let err= validPartyReport(party_report);
  if(err){
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
