import { drizzleClient } from "@/infra/database/drizzle/drizzle.service";
import { DRIZZLE_MIGRATIONS_DIR } from "@/infra/database/drizzle/setup";
import { execSync } from "child_process";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { rm } from "fs/promises";
import { afterAll, beforeAll } from "vitest";

const postgresTestingSchema = `e2e-${randomUUID()}`;

beforeAll(async () => {
  process.env.POSTGRES_SCHEMA = postgresTestingSchema;

  execSync("pnpm migrate:generate");

  await drizzleClient.execute(sql`
    CREATE SCHEMA ${sql.identifier(postgresTestingSchema)};
  `);

  await migrate(drizzleClient, {
    migrationsFolder: DRIZZLE_MIGRATIONS_DIR,
    migrationsSchema: postgresTestingSchema,
  });

  await drizzleClient.execute(sql`
    SET 
      search_path 
    TO 
      ${sql.identifier(postgresTestingSchema)};
  `);
});

afterAll(async () => {
  await Promise.all([
    rm(DRIZZLE_MIGRATIONS_DIR, { force: true, recursive: true }),
    drizzleClient.execute(sql`
      DROP SCHEMA IF EXISTS ${sql.identifier(postgresTestingSchema)} CASCADE;
    `),
  ]);
});
