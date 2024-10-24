import { TransactionDebitExpense } from "@/domain/entities/transaction-debit-expense.entity";
import { TransactionDebitExpenseRepository } from "@/domain/gateways/repositories/debit-expense-transaction.repository";
import { Injectable } from "@nestjs/common";
import { DrizzleService, DrizzleSession } from "../drizzle.service";
import { drizzleTransactionTable } from "../schemas/drizzle-transaction.schema";

@Injectable()
export class DrizzleTransactionDebitExpenseRepository
  implements TransactionDebitExpenseRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async createUnique(
    transactionDebitExpense: TransactionDebitExpense,
    { session }: { session: DrizzleSession } = { session: this.drizzle.client },
  ): Promise<void> {
    await session
      .insert(drizzleTransactionTable)
      .values(transactionDebitExpense.getRawData());
  }
}
