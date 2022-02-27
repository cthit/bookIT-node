import passport from "passport";
import pg from "pg";
import { PrismaClient } from "@prisma/client";

export interface Tools {
  db: pg.Pool;
  prisma: PrismaClient;
  passport: passport.PassportStatic;
}
