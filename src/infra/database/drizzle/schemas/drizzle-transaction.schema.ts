import { TransactionData } from "@/domain/entities/transaction.entity";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";
import { drizzleBankAccountTable } from "./drizzle-bank-account.schema";
import { drizzleTransactionCategoryTable } from "./drizzle-transaction-category.schema";
import { customMoneyType } from "./utils";

export type DrizzleTransactionData = InferSelectModel<
  typeof drizzleTransactionTable
>;

export type DrizzleTransactionDataCreate = InferInsertModel<
  typeof drizzleTransactionTable
>;

export const drizzleTransactionRecurrencePeriodsEnum = ddl.pgEnum(
  "transaction_recurrence_periods",
  ["YEAR", "MONTH", "WEEK"],
);

export const drizzleTransactionTable = ddl.pgTable("transactions", {
  id: ddl.uuid("id").primaryKey(),
  // bankAccountId: ddl
  //   .uuid("bank_account_id")
  //   .references(() => drizzleBankAccountTable.id, {
  //     onUpdate: "cascade",
  //     onDelete: "cascade",
  //   }),
  // transactionCategoryId: ddl
  //   .uuid("transaction_category_id")
  //   .references(() => drizzleTransactionCategoryTable.id, {
  //     onUpdate: "cascade",
  //     onDelete: "restrict",
  //   }),
  recurrenceOriginId: ddl
    .uuid("recurrence_origin_id")
    .references(() => drizzleBankAccountTable.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  recurrencePeriod:
    drizzleTransactionRecurrencePeriodsEnum("recurrence_period"),
  recurrenceInterval: ddl.integer("recurrence_interval"),
  recurrenceLimit: ddl.integer("recurrence_limit"),
  recurrenceOccurrence: ddl.integer("recurrence_occurrence").array(),
  transactedAt: ddl
    .timestamp("transacted_at", { withTimezone: true })
    .notNull(),
  // accomplishedAt: ddl.timestamp("accomplished_at", { withTimezone: true }),
  amount: customMoneyType("amount").notNull(),
  description: ddl.varchar("description").notNull(),
  updatedAt: ddl.timestamp("updated_at", { withTimezone: true }),
  createdAt: ddl.timestamp("created_at", { withTimezone: true }).notNull(),
} satisfies Record<keyof TransactionData, ddl.PgColumnBuilderBase>);
