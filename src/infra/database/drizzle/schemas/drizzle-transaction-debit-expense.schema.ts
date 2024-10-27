import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";
import { drizzleBankAccountTable } from "./drizzle-bank-account.schema";

import { TransactionDebitExpenseData } from "@/domain/entities/transaction-debit-expense.entity";
import { TransactionData } from "@/domain/entities/transaction.entity";
import { drizzleTransactionCategoryTable } from "./drizzle-transaction-category.schema";
import { drizzleTransactionTable } from "./drizzle-transaction.schema";

export type DrizzleTransactionDebitExpenseData = InferSelectModel<
  typeof drizzleTransactionDebitExpenseTable
>;

export type DrizzleTransactionDebitExpenseDataCreate = InferInsertModel<
  typeof drizzleTransactionDebitExpenseTable
>;

type TransactionDebitExpenseFields =
  | keyof Omit<TransactionDebitExpenseData, keyof TransactionData>
  | "transactionId";

export const drizzleTransactionDebitExpenseTable = ddl.pgTable(
  "transaction_debit_expenses",
  {
    transactionId: ddl
      .uuid("transaction_id")
      .primaryKey()
      .references(() => drizzleTransactionTable.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    bankAccountId: ddl
      .uuid("bank_account_id")
      .references(() => drizzleBankAccountTable.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    transactionCategoryId: ddl
      .uuid("transaction_category_id")
      .references(() => drizzleTransactionCategoryTable.id, {
        onUpdate: "cascade",
        onDelete: "restrict",
      }),
    accomplishedAt: ddl.timestamp("accomplished_at", { withTimezone: true }),
  } satisfies Record<TransactionDebitExpenseFields, ddl.PgColumnBuilderBase>,
);
