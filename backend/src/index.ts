import express from "express";
import session from "express-session";
import { setupRoutes } from "./routes";
import { init } from "./authentication/gamma.strategy";
import passport from "passport";
import redis from "redis";
import { PrismaClient } from "@prisma/client";
const RedisStore = require("connect-redis")(session);

const app = express();
init(passport);
app.use(
  session({
    secret: String(process.env.SESSION_SECRET),
    store: new RedisStore({
      client: redis.createClient({
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        password: process.env.REDIS_PASS,
        db: 1,
      }),
    }),
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());

const prisma = new PrismaClient();

setupRoutes(app, { prisma, passport });

app.listen(Number(process.env.PORT) || 8080);
