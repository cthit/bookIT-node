import { createServer } from "node:http";
import express from "express";
import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { auth } from "express-openid-connect";
import { setupRoutes } from "./routes";
import type { UserInfo } from "./models/user";
import { authRequest } from "./utils";
import { createSessionStore } from "./auth/session-store";
import { cleanupPersonalData, startCleanup } from "./cleanup";
import { databaseUrl, requiredEnvironment } from "./environment";

interface GammaGroup {
  superGroup?: { type: string; name: string };
}

async function main() {
  process.env.TZ ??= "Europe/Stockholm";

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl() }),
  });

  if (process.argv.includes("--cleanup")) {
    try {
      await cleanupPersonalData(prisma);
    } finally {
      await prisma.$disconnect();
    }

    return;
  }

  const issuerBaseURL = requiredEnvironment("ISSUER_BASE_URL");
  const issuer = new URL(issuerBaseURL);
  const localIssuer =
    ["localhost", "127.0.0.1", "[::1]"].includes(issuer.hostname) ||
    issuer.hostname.endsWith(".localhost");

  if ((process.env.NODE_ENV !== "production" || process.env.CI) && !localIssuer) {
    throw new Error("Development and CI require a local Gamma ISSUER_BASE_URL");
  }

  requiredEnvironment("API_KEY");

  const app = express();

  app.disable("x-powered-by");

  if (process.env.TRUST_PROXY === "1") {
    app.set("trust proxy", 1);
  }

  const httpServer = createServer(app);

  const redis = createClient({
    // Redis 5 does not support RESP3.
    RESP: 2,
    maintNotifications: "disabled",
    socket: {
      host: process.env.REDIS_HOST || "localhost",
      port: Number(process.env.REDIS_PORT || 6379),
    },
    password: process.env.REDIS_PASS || undefined,
    database: 1,
  });

  redis.on("error", (error) => console.error("Redis connection error", error));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use(
    auth({
      issuerBaseURL,
      baseURL: requiredEnvironment("BASE_URL"),
      clientID: requiredEnvironment("CLIENT_ID"),
      clientSecret: requiredEnvironment("CLIENT_SECRET"),
      secret: process.env.SECRET || requiredEnvironment("SESSION_SECRET"),
      idpLogout: true,
      authRequired: false,
      authorizationParams: { scope: "openid profile", response_type: "code" },
      clientAuthMethod: "client_secret_basic",
      routes: { callback: "/api/callback", login: "/api/login", logout: "/api/logout" },
      session: {
        store: createSessionStore(redis),
        signSessionStoreCookie: true,
        requireSignedSessionStoreCookie: true,
      },
      afterCallback: async (_req, _res, session) => {
        const userInfo = await authRequest<UserInfo>("/oauth2/userinfo", session.access_token);

        const [authorities, groups] = await Promise.all([
          authRequest<string[]>(
            `/api/client/v1/authorities/for/${encodeURIComponent(userInfo.sub)}`,
          ),
          authRequest<GammaGroup[]>(
            `/api/client/v1/groups/for/${encodeURIComponent(userInfo.sub)}`,
          ),
        ]);

        return {
          ...session,
          is_admin: authorities.includes("admin"),
          groups: [
            ...new Set(
              groups.flatMap(({ superGroup }) =>
                superGroup && superGroup.type.toLowerCase() !== "alumni" ? [superGroup.name] : [],
              ),
            ),
          ],
        };
      },
    }),
  );

  app.use(async (req, res, next) => {
    if (req.oidc.isAuthenticated()) {
      next();

      return;
    }

    if (req.path.startsWith("/api/")) {
      res.status(401).json({ error: "Authentication required" });

      return;
    }

    await res.oidc.login({ returnTo: req.originalUrl });
  });

  await Promise.all([redis.connect(), prisma.$connect()]);

  const apollo = await setupRoutes(app, { prisma }, httpServer);

  app.use(((error, _req, res, _next) => {
    console.error("Request failed", error instanceof Error ? error.message : "Unknown error");
    res.status(500).json({ error: "Request failed" });
  }) satisfies express.ErrorRequestHandler);

  const port = Number(process.env.PORT || 8080);

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(port, resolve);
  });

  console.log(`BookIT listening on port ${port}`);

  const stopCleanup = startCleanup(prisma);
  let stopping = false;

  const stop = () => {
    if (stopping) {
      return;
    }

    stopping = true;

    void Promise.all([apollo.stop(), stopCleanup()])
      .then(() => Promise.all([redis.close(), prisma.$disconnect()]))
      .catch((error) => {
        console.error("Shutdown failed", error);
        process.exitCode = 1;
      });
  };

  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}

void main().catch((error) => {
  console.error("BookIT startup failed", error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
