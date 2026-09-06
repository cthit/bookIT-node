import { join } from "node:path";
import type { Server } from "node:http";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";
import express from "express";
import proxy from "express-http-proxy";
import { getResolvers } from "../resolvers";
import type { Context, Tools } from "../utils/commonTypes";
import { authenticatedUser } from "../auth/user";

export const setupRoutes = async (app: express.Application, tools: Tools, httpServer: Server) => {
  const typeDefs = mergeTypeDefs(loadFilesSync(join(__dirname, "../schemas/v1/*.gql")));

  const server = new ApolloServer<Context>({
    schema: makeExecutableSchema({ typeDefs, resolvers: getResolvers(tools) }),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    includeStacktraceInErrorResponses: false,
  });

  await server.start();

  app.use(
    "/api/graphql/v1",
    express.json({ limit: "100kb" }),
    expressMiddleware(server, {
      context: async ({ req }: { req: express.Request }) => ({ user: authenticatedUser(req) }),
    }),
  );

  app.use("/", proxy(process.env.FRONTEND_URL || "http://localhost:3001"));

  return server;
};
