import { join } from "path";

import { graphqlHTTP } from "express-graphql";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { getResolvers } from "../resolvers";
import proxy from "express-http-proxy";

// Import types
import express from "express";
import { Tools } from "../utils/commonTypes";

const setupGraphql = (app: express.Application, tools: Tools) => {
  const graphiql = process.env.GRAPHIQL == "true";
  const typeDefs = mergeTypeDefs(
    loadFilesSync(join(__dirname, "../schemas/v1/*.gql")),
  );

  const router = express.Router();
  router.use(
    "/v1",
    graphqlHTTP(async (req: any) => ({
      schema: makeExecutableSchema({
        typeDefs: typeDefs,
        resolvers: getResolvers(tools),
      }),
      graphiql: graphiql,
      context: {user: {
        ...req.oidc.user,
        groups: req.appSession.groups,
        is_admin: req.appSession.is_admin
      }},
    })),
  );
  app.use("/api/graphql", router);
};

export const setupRoutes = (app: express.Application, tools: Tools) => {
  setupGraphql(app, tools);
  const frontend_url = process.env.FRONTEND_URL || "http://localhost:3001";
  app.use("/", proxy(frontend_url));
};
