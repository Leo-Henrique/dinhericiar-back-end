import { env } from "@/infra/env";
import { defineConfig } from "drizzle-kit";
import { resolve } from "path";

export const DRIZZLE_MIGRATIONS_DIR =
  env.NODE_ENV === "test"
    ? resolve(__dirname, "../../../../test/e2e/migrations")
    : resolve(__dirname, "./migrations");

export default defineConfig({
  schema: resolve(__dirname, "./schemas/*.schema.ts"),
  out: DRIZZLE_MIGRATIONS_DIR,
  dialect: "postgresql",
  dbCredentials: {
    user: env.POSTGRES_USERNAME,
    password: env.POSTGRES_PASSWORD,
    host: env.POSTGRES_HOSTNAME,
    port: env.POSTGRES_PORT,
    database: env.POSTGRES_DATABASE,
    ssl: false,
  },
  verbose: true,
  strict: true,
});
