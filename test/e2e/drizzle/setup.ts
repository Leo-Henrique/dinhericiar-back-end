import { drizzleConfig } from "@/infra/database/drizzle/setup";
import { defineConfig } from "drizzle-kit";

export const DRIZZLE_E2E_MIGRATIONS_DIR_FROM_ROOT =
  "./test/e2e/drizzle/migrations";

export default defineConfig({
  ...drizzleConfig,
  out: DRIZZLE_E2E_MIGRATIONS_DIR_FROM_ROOT,
});
