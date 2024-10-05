import { Mapper } from "@/core/mapper";
import { env } from "@/infra/env";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ExtractTablesWithRelations, SQLWrapper, sql } from "drizzle-orm";
import { NodePgQueryResultHKT, drizzle } from "drizzle-orm/node-postgres";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";

export type DrizzleClient = typeof drizzleClient;

export type DrizzleTransactionClient = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

export type DrizzleSession = DrizzleClient | DrizzleTransactionClient;

export const postgresPool = new Pool({
  user: env.POSTGRES_USERNAME,
  password: env.POSTGRES_PASSWORD,
  host: env.POSTGRES_HOSTNAME,
  port: env.POSTGRES_PORT,
  database: env.POSTGRES_DATABASE,
  connectionTimeoutMillis: 2000,
});

export const drizzleClient = drizzle(postgresPool, {
  logger: env.NODE_ENV === "development",
});

@Injectable()
export class DrizzleService implements OnModuleInit {
  public client = drizzleClient;
  public static isConnectionSuccessful: boolean | null = null;

  private async checkConnectionStatus() {
    await this.client.execute(sql`SELECT 'status';`);

    DrizzleService.isConnectionSuccessful = true;
  }

  public async onModuleInit() {
    if (!DrizzleService.isConnectionSuccessful)
      await this.checkConnectionStatus();
  }

  public async executeToGet<RowResult extends Record<string, unknown>>(
    sql: SQLWrapper,
    { session }: { session: DrizzleSession } = { session: this.client },
  ) {
    const { rows } = await session.execute(sql);
    const result = [];

    for (const row of rows) {
      const columnNames = Object.keys(row);

      for (const columnName of columnNames) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = row[columnName] as any;
        const isDateValue =
          typeof value === "string" &&
          isNaN(Number(value)) &&
          !isNaN(new Date(value).getTime());

        if (isDateValue) {
          row[columnName] = new Date(value);
          continue;
        }

        const isNumberValue = /^-?\d*\.?\d+$/.test(value);

        if (isNumberValue) {
          row[columnName] = Number(value);
        }
      }

      result.push(Mapper.toCamelCaseProperties(row));
    }

    return result as RowResult[];
  }
}
