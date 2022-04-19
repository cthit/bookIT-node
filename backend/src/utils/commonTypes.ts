import passport from "passport";
import { PrismaClient } from "@prisma/client";

export interface Tools {
  prisma: PrismaClient;
  passport: passport.PassportStatic;
}
