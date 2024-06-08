import express from "express";
import session from "express-session";
import { setupRoutes } from "./routes";
import redis from "redis";
import { PrismaClient } from "@prisma/client";
const RedisStore = require("connect-redis")(session);
import { auth } from "express-openid-connect";

const app = express();
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

app.use(
  auth({
    issuerBaseURL: "https://auth.chalmers.it",
    baseURL: "http://localhost:3001",
    clientID: "hgh",
    clientSecret: "sds",
    secret: "sds",
    idpLogout: true,
    authRequired: true,
    authorizationParams: { scope: "openid profile", response_type: "code" },
    clientAuthMethod: "client_secret_basic",
    routes: { callback: "/api/callback" },
  }),
);

const prisma = new PrismaClient();

setupRoutes(app, { prisma });

app.listen(Number(process.env.PORT) || 8080);
