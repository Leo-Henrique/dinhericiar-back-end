import { drizzleClient } from "@/infra/database/drizzle/drizzle.service";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll } from "vitest";
import {
  DRIZZLE_E2E_MIGRATIONS_DIR_FROM_ROOT,
  POSTGRES_E2E_SCHEMA_NAME,
} from "./drizzle/setup";

beforeAll(async () => {
  await migrate(drizzleClient, {
    migrationsFolder: DRIZZLE_E2E_MIGRATIONS_DIR_FROM_ROOT,
    migrationsSchema: POSTGRES_E2E_SCHEMA_NAME,
  });

  await drizzleClient.execute(sql`
    SET 
      search_path 
    TO 
      ${sql.identifier(POSTGRES_E2E_SCHEMA_NAME)};
  `);
});

afterAll(async () => {
  await drizzleClient.execute(sql`
    DROP SCHEMA IF EXISTS ${sql.identifier(POSTGRES_E2E_SCHEMA_NAME)} CASCADE;
  `);
});
