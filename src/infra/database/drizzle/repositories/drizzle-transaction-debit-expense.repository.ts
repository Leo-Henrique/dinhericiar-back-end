import { TransactionDebitExpense } from "@/domain/entities/transaction-debit-expense.entity";
import { TransactionRecurrenceInstallment } from "@/domain/entities/transaction-recurrence-installment.entity";
import { TransactionDebitExpenseRepository } from "@/domain/gateways/repositories/debit-expense-transaction.repository";
import { Injectable } from "@nestjs/common";
import { DrizzleService, DrizzleSession } from "../drizzle.service";
import { DrizzleTransactionDebitExpenseMapper } from "../mappers/drizzle-transaction-debit-expense.mapper";
import {
  DrizzleTransactionDebitExpenseDataCreate,
  drizzleTransactionDebitExpenseTable,
} from "../schemas/drizzle-transaction-debit-expense.schema";
import { drizzleTransactionRecurrenceTable } from "../schemas/drizzle-transaction-recurrence.schema";
import {
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
    await session.insert(drizzleTransactionRecurrenceTable).values({
      ...transactionRecurrenceInstallment.getRawData(),
      type: "INSTALLMENT",
    });

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
}
