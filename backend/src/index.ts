import express from "express";
import session from "express-session";
import { setupRoutes } from "./routes";
import redis from "redis";
import { PrismaClient } from "@prisma/client";
const RedisStore = require("connect-redis")(session);
import { auth } from "express-openid-connect";
import { UserInfo } from "./models/user";
import { authRequest } from "./utils";

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
    },
    afterCallback: async (req, res, session, decodedState) => {
      const userInfo: UserInfo = await authRequest("/oauth2/userinfo", session.access_token)
      const authorities: string[] = await authRequest(`/api/client/v1/authorities/for/${userInfo.sub}`)
      const groups: any[] = await authRequest(`/api/client/v1/groups/for/${userInfo.sub}`)
      return {
        ...session,
        is_admin: authorities.includes("admin"),
        groups: groups
          .map((group) => group?.superGroup)
          .filter(group => group?.type !== "alumni")
          .map(group => group?.name)
      };
    }
  }),
);

const prisma = new PrismaClient();

setupRoutes(app, { prisma });

app.listen(Number(process.env.PORT) || 8080);
