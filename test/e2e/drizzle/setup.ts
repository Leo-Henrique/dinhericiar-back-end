import { drizzleConfig } from "@/infra/database/drizzle/setup";
import { defineConfig } from "drizzle-kit";

export const POSTGRES_E2E_SCHEMA_NAME = "e2e" as const;
export const DRIZZLE_E2E_MIGRATIONS_DIR_FROM_ROOT =
  "./test/e2e/drizzle/migrations";

process.env.POSTGRES_SCHEMA = POSTGRES_E2E_SCHEMA_NAME;

export default defineConfig({
  ...drizzleConfig,
  out: DRIZZLE_E2E_MIGRATIONS_DIR_FROM_ROOT,
  migrations: {
    schema: POSTGRES_E2E_SCHEMA_NAME,
  },
});
