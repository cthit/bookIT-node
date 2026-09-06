import "dotenv/config";
import { defineConfig } from "prisma/config";
import { databaseUrl } from "./src/environment";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Client generation during the image build does not need a database.
    url: process.env.DB_HOST ? databaseUrl() : undefined,
  },
});
