import { drizzleConfig } from "@/infra/database/drizzle/setup";
import { defineConfig } from "drizzle-kit";

export const DRIZZLE_MIGRATIONS_DIR_IN_INTEGRATION_TESTING_ENVIRONMENT =
  "./test/integration/drizzle/migrations";

export default defineConfig({
  ...drizzleConfig,
  out: DRIZZLE_MIGRATIONS_DIR_IN_INTEGRATION_TESTING_ENVIRONMENT,
});
