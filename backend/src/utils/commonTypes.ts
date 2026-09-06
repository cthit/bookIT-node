import { PrismaClient } from "@prisma/client";
import { User } from "../models/user";

export interface Tools {
  prisma: PrismaClient;
}

export interface Context {
  user: User;
}
