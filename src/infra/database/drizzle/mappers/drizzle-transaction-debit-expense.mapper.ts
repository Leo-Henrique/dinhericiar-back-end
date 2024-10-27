import { TransactionDebitExpense } from "@/domain/entities/transaction-debit-expense.entity";
import { DrizzleTransactionDebitExpenseData } from "../schemas/drizzle-transaction-debit-expense.schema";
import { DrizzleTransactionDataCreate } from "../schemas/drizzle-transaction.schema";

export class DrizzleTransactionDebitExpenseMapper {
  static toDrizzle(transactionDebitExpense: TransactionDebitExpense) {
    const {
      bankAccountId,
      transactionCategoryId,
      accomplishedAt,
      ...transactionRawData
    } = transactionDebitExpense.getRawData();

    return {
      drizzleTransactionValues: {
        ...transactionRawData,
        type: "DEBIT_EXPENSE",
      } satisfies DrizzleTransactionDataCreate,
      drizzleTransactionDebitExpenseValues: {
        transactionId: transactionRawData.id,
        bankAccountId,
        transactionCategoryId,
        accomplishedAt,
      } satisfies DrizzleTransactionDebitExpenseData,
    };
  }
}
