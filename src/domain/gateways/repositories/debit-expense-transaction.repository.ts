import { TransactionDebitExpense } from "@/domain/entities/transaction-debit-expense.entity";
import { TransactionRecurrenceFixed } from "@/domain/entities/transaction-recurrence-fixed.entity";
import { TransactionRecurrenceInstallment } from "@/domain/entities/transaction-recurrence-installment.entity";
import { UnitOfWorkSessionOptions } from "../unit-of-work";

export abstract class TransactionDebitExpenseRepository {
  abstract createUnique(
    transactionDebitExpense: TransactionDebitExpense,
    options?: UnitOfWorkSessionOptions,
  ): Promise<void>;
  abstract createManyWithInstallmentRecurrence(
    transactionDebitExpenses: TransactionDebitExpense[],
    transactionRecurrenceInstallment: TransactionRecurrenceInstallment,
    options?: UnitOfWorkSessionOptions,
  ): Promise<void>;
  abstract createManyWithFixedRecurrence(
    transactionDebitExpenses: TransactionDebitExpense[],
    transactionRecurrenceFixed: TransactionRecurrenceFixed,
    options?: UnitOfWorkSessionOptions,
  ): Promise<void>;
}
