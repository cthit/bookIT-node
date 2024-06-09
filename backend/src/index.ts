import express from "express";
import session from "express-session";
import { setupRoutes } from "./routes";
import redis from "redis";
import { PrismaClient } from "@prisma/client";
const RedisStore = require("connect-redis")(session);
import { auth } from "express-openid-connect";

const app = express();
const session_store = new RedisStore({
  client: redis.createClient({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASS,
    db: 1,
  }),
})

app.use(
  session({
    secret: String(process.env.SESSION_SECRET),
    store: session_store,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(
  auth({
    idpLogout: true,
    authRequired: true,
    authorizationParams: { scope: "openid profile", response_type: "code" },
    clientAuthMethod: "client_secret_basic",
    routes: { callback: "/api/callback" },
    session: {
      store: session_store,
    }
  }),
);

const prisma = new PrismaClient();

setupRoutes(app, { prisma });

app.listen(Number(process.env.PORT) || 8080);
