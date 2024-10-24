import { TransactionCategoryData } from "@/domain/entities/transaction-category.entity";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";
import { drizzleUserTable } from "./drizzle-user.schema";

export type DrizzleTransactionCategoryData = InferSelectModel<
  typeof drizzleTransactionCategoryTable
>;

export type DrizzleTransactionCategoryDataCreate = InferInsertModel<
  typeof drizzleTransactionCategoryTable
>;

export const drizzleTransactionCategoryTypesEnum = ddl.pgEnum(
  "transaction_category_types",
  ["EXPENSE", "EARNING"],
);

export const drizzleTransactionCategoryTable = ddl.pgTable(
  "transaction_categories",
  {
    id: ddl.uuid("id").primaryKey(),
    userId: ddl
      .uuid("user_id")
      .notNull()
      .references(() => drizzleUserTable.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    transactionType:
      drizzleTransactionCategoryTypesEnum("transaction_type").notNull(),
    name: ddl.varchar("name").notNull(),
    updatedAt: ddl.timestamp("updated_at", { withTimezone: true }),
    createdAt: ddl.timestamp("created_at", { withTimezone: true }).notNull(),
  } satisfies Record<keyof TransactionCategoryData, ddl.PgColumnBuilderBase>,
  table => ({
    uniqueNamePerUser: ddl
      .unique()
      .on(table.userId, table.transactionType, table.name)
      .nullsNotDistinct(),
  }),
);
