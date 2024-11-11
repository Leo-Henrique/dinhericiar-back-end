import {
  TransactionDebitExpense,
  TransactionDebitExpenseEntity,
} from "@/domain/entities/transaction-debit-expense.entity";
import { TransactionRecurrenceFixed } from "@/domain/entities/transaction-recurrence-fixed.entity";
import { TransactionRecurrenceInstallment } from "@/domain/entities/transaction-recurrence-installment.entity";
import {
  CreateManyWithFixedRecurrenceOptions,
  TransactionDebitExpenseRepository,
} from "@/domain/gateways/repositories/transaction-debit-expense.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService, DrizzleSession } from "../drizzle.service";
import { DrizzleTransactionDebitExpenseMapper } from "../mappers/drizzle-transaction-debit-expense.mapper";
import { DrizzleTransactionRecurrenceFixedMapper } from "../mappers/drizzle-transaction-recurrence-fixed.mapper";
import { DrizzleTransactionRecurrenceInstallmentMapper } from "../mappers/drizzle-transaction-recurrence-installment.mapper";
import {
  DrizzleTransactionDebitExpenseData,
  DrizzleTransactionDebitExpenseDataCreate,
  drizzleTransactionDebitExpenseTable,
} from "../schemas/drizzle-transaction-debit-expense.schema";
import { drizzleTransactionRecurrenceTable } from "../schemas/drizzle-transaction-recurrence.schema";
import {
  DrizzleTransactionData,
  DrizzleTransactionDataCreate,
  drizzleTransactionTable,
} from "../schemas/drizzle-transaction.schema";

@Injectable()
export class DrizzleTransactionDebitExpenseRepository
  implements TransactionDebitExpenseRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async createUnique(
    transactionDebitExpense: TransactionDebitExpense,
    { session }: { session: DrizzleSession } = { session: this.drizzle.client },
  ): Promise<void> {
    const { drizzleTransactionValues, drizzleTransactionDebitExpenseValues } =
      DrizzleTransactionDebitExpenseMapper.toDrizzle(transactionDebitExpense);

    await session
      .insert(drizzleTransactionTable)
      .values(drizzleTransactionValues);
    await session
      .insert(drizzleTransactionDebitExpenseTable)
      .values(drizzleTransactionDebitExpenseValues);
  }

  async createManyWithInstallmentRecurrence(
    transactionDebitExpenses: TransactionDebitExpense[],
    transactionRecurrenceInstallment: TransactionRecurrenceInstallment,
    { session }: { session: DrizzleSession } = { session: this.drizzle.client },
  ): Promise<void> {
    const drizzleTransactionRecurrenceInstallmentValues =
      DrizzleTransactionRecurrenceInstallmentMapper.toDrizzle(
        transactionRecurrenceInstallment,
      );

    await session
      .insert(drizzleTransactionRecurrenceTable)
      .values(drizzleTransactionRecurrenceInstallmentValues);

    const drizzleTransactionAllValues: DrizzleTransactionDataCreate[] = [];
    const drizzleTransactionDebitExpenseAllValues: DrizzleTransactionDebitExpenseDataCreate[] =
      [];

    for (const transactionDebitExpense of transactionDebitExpenses) {
      const { drizzleTransactionValues, drizzleTransactionDebitExpenseValues } =
        DrizzleTransactionDebitExpenseMapper.toDrizzle(transactionDebitExpense);

      drizzleTransactionAllValues.push(drizzleTransactionValues);
      drizzleTransactionDebitExpenseAllValues.push(
        drizzleTransactionDebitExpenseValues,
      );
    }

    const chunk = 1000;

    for (
      let currentChunk = 0;
      currentChunk < transactionDebitExpenses.length;
      currentChunk += chunk
    ) {
      const drizzleTransactionAllValuesChunk =
        drizzleTransactionAllValues.slice(currentChunk, currentChunk + chunk);
      const drizzleTransactionDebitExpenseAllValuesChunk =
        drizzleTransactionDebitExpenseAllValues.slice(
          currentChunk,
          currentChunk + chunk,
        );

      await session
        .insert(drizzleTransactionTable)
        .values(drizzleTransactionAllValuesChunk);
      await session
        .insert(drizzleTransactionDebitExpenseTable)
        .values(drizzleTransactionDebitExpenseAllValuesChunk);
    }
  }

  async createManyWithFixedRecurrence(
    transactionDebitExpenses: TransactionDebitExpense[],
    transactionRecurrenceFixed: TransactionRecurrenceFixed,
    {
      session,
      createRecurrence,
    }: CreateManyWithFixedRecurrenceOptions & { session: DrizzleSession },
  ): Promise<void> {
    session = session ?? this.drizzle.client;

    if (createRecurrence) {
      const drizzleTransactionRecurrenceFixedValues =
        DrizzleTransactionRecurrenceFixedMapper.toDrizzle(
          transactionRecurrenceFixed,
        );

      await session
        .insert(drizzleTransactionRecurrenceTable)
        .values(drizzleTransactionRecurrenceFixedValues);
    }

    const drizzleTransactionAllValues: DrizzleTransactionDataCreate[] = [];
    const drizzleTransactionDebitExpenseAllValues: DrizzleTransactionDebitExpenseDataCreate[] =
      [];

    for (const transactionDebitExpense of transactionDebitExpenses) {
      const { drizzleTransactionValues, drizzleTransactionDebitExpenseValues } =
        DrizzleTransactionDebitExpenseMapper.toDrizzle(transactionDebitExpense);

      drizzleTransactionAllValues.push(drizzleTransactionValues);
      drizzleTransactionDebitExpenseAllValues.push(
        drizzleTransactionDebitExpenseValues,
      );
    }

    const chunk = 1000;

    for (
      let currentChunk = 0;
      currentChunk < transactionDebitExpenses.length;
      currentChunk += chunk
    ) {
      const drizzleTransactionAllValuesChunk =
        drizzleTransactionAllValues.slice(currentChunk, currentChunk + chunk);
      const drizzleTransactionDebitExpenseAllValuesChunk =
        drizzleTransactionDebitExpenseAllValues.slice(
          currentChunk,
          currentChunk + chunk,
        );

      await session
        .insert(drizzleTransactionTable)
        .values(drizzleTransactionAllValuesChunk);
      await session
        .insert(drizzleTransactionDebitExpenseTable)
        .values(drizzleTransactionDebitExpenseAllValuesChunk);
    }
  }

  async findUniqueLastOfFixedRecurrence(
    transactionRecurrenceFixed: TransactionRecurrenceFixed,
  ): Promise<TransactionDebitExpense | null> {
    type Row = DrizzleTransactionData & DrizzleTransactionDebitExpenseData;

    const query = sql`
      SELECT
        transactions.*,
        transaction_debit_expenses.*
      FROM
        transactions
      INNER JOIN
        transaction_recurrences 
      ON 
        transaction_recurrences.id = ${transactionRecurrenceFixed.id.value}
      INNER JOIN
        transaction_debit_expenses
      ON
        transaction_debit_expenses.transaction_id = transactions.id
      ORDER BY
        created_at DESC
      LIMIT 1
    `;

    const [transactionDebitExpenseOnDatabase] =
      await this.drizzle.executeToGet<Row>(query);

    if (!transactionDebitExpenseOnDatabase) return null;

    return TransactionDebitExpenseEntity.create(
      transactionDebitExpenseOnDatabase,
    );
  }
}
