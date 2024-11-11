import { TransactionRecurrenceFixed } from "@/domain/entities/transaction-recurrence-fixed.entity";
import { TransactionRecurrenceFixedRepository } from "@/domain/gateways/repositories/transaction-recurrence-fixed.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import { DrizzleTransactionRecurrenceFixedMapper } from "../mappers/drizzle-transaction-recurrence-fixed.mapper";
import { DrizzleTransactionRecurrenceData } from "../schemas/drizzle-transaction-recurrence.schema";

@Injectable()
export class DrizzleTransactionRecurrenceFixedRepository
  implements TransactionRecurrenceFixedRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async findUniqueById(id: string): Promise<TransactionRecurrenceFixed | null> {
    type Row = DrizzleTransactionRecurrenceData;

    const query = sql`
      SELECT
        *
      FROM
        transaction_recurrences
      WHERE
        id = ${id}
    `;
    const [transactionRecurrenceFixedOnDatabase] =
      await this.drizzle.executeToGet<Row>(query);

    if (!transactionRecurrenceFixedOnDatabase) return null;

    return DrizzleTransactionRecurrenceFixedMapper.toDomain(
      transactionRecurrenceFixedOnDatabase,
    );
  }
}
