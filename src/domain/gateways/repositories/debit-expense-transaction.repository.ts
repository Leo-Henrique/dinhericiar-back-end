import { TransactionDebitExpense } from "@/domain/entities/transaction-debit-expense.entity";
import { UnitOfWorkSessionOptions } from "../unit-of-work";

export abstract class TransactionDebitExpenseRepository {
  abstract createUnique(
    transactionDebitExpense: TransactionDebitExpense,
    options?: UnitOfWorkSessionOptions,
  ): Promise<void>;
}
