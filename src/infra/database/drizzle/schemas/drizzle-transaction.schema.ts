import { TransactionData } from "@/domain/entities/transaction.entity";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";
import { drizzleTransactionRecurrenceTable } from "./drizzle-transaction-recurrence.schema";
import { customMoneyType } from "./utils";

export type DrizzleTransactionData = InferSelectModel<
  typeof drizzleTransactionTable
>;

export type DrizzleTransactionDataCreate = InferInsertModel<
  typeof drizzleTransactionTable
>;

export const drizzleTransactionTypesEnum = ddl.pgEnum("transaction_types", [
  "DEBIT_EXPENSE",
  "CREDIT_EXPENSE",
  "EARNING",
  "TRANSFERENCE",
]);

type TransactionFields = keyof TransactionData | "type";

export const drizzleTransactionTable = ddl.pgTable("transactions", {
  id: ddl.uuid("id").primaryKey(),
  type: drizzleTransactionTypesEnum("type"),
  transactionRecurrenceId: ddl
    .uuid("transaction_recurrence_id")
    .references(() => drizzleTransactionRecurrenceTable.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  transactedAt: ddl
    .timestamp("transacted_at", { withTimezone: true })
    .notNull(),
  amount: customMoneyType("amount").notNull(),
  description: ddl.varchar("description").notNull(),
  updatedAt: ddl.timestamp("updated_at", { withTimezone: true }),
  createdAt: ddl.timestamp("created_at", { withTimezone: true }).notNull(),
} satisfies Record<TransactionFields, ddl.PgColumnBuilderBase>);
