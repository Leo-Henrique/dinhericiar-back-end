import { drizzleClient } from "@/infra/database/drizzle/drizzle.service";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { afterAll, beforeAll } from "vitest";
import { DRIZZLE_E2E_MIGRATIONS_DIR_FROM_ROOT } from "./drizzle/setup";

const postgresSchemaNameFromCurrentTestSuite = "e2e_" + randomUUID();

beforeAll(async () => {
  await drizzleClient.execute(sql`
    CREATE SCHEMA ${sql.identifier(postgresSchemaNameFromCurrentTestSuite)};
    SET search_path TO ${sql.identifier(postgresSchemaNameFromCurrentTestSuite)};
  `);

  await migrate(drizzleClient, {
    migrationsFolder: DRIZZLE_E2E_MIGRATIONS_DIR_FROM_ROOT,
    migrationsSchema: postgresSchemaNameFromCurrentTestSuite,
  });
});

afterAll(async () => {
  await drizzleClient.execute(sql`
    DROP SCHEMA ${sql.identifier(postgresSchemaNameFromCurrentTestSuite)} CASCADE;
  `);
});
