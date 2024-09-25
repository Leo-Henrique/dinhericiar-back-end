import { pgSchema, pgTable } from "drizzle-orm/pg-core";

export function tableWithSchema() {
  const customSchema = process.env.POSTGRES_SCHEMA;

  if (customSchema) return pgSchema(customSchema).table;

  return pgTable;
}
