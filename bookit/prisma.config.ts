import { resolve } from "node:path";
import { config } from "dotenv";
import { defineConfig } from "prisma/config";
import { databaseUrl } from "./src/environment";

config({ path: resolve(__dirname, "../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Client generation during the image build does not need a database.
    url: process.env.DB_HOST ? databaseUrl() : undefined,
  },
});
