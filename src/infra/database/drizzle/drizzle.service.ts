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
  ) {
    const { rows } = await this.client.execute<RowResult>(sql);
    const result = [];

    for (const row of rows) {
      result.push(Mapper.toCamelCaseProperties(row));
    }

    return result;
  }
}
