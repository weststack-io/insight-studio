import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// In local dev, prefer .env.local so Prisma CLI matches Next.js runtime env precedence.
loadEnv({ path: ".env.local" });
loadEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("AZURE_SQL_CONNECTION_STRING"),
  },
});
