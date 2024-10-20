import { CreditCardData } from "@/domain/entities/credit-card.entity";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";
import { drizzleBankAccountTable } from "./drizzle-bank-account.schema";
import { customMoneyType } from "./utils";

export type DrizzleCreditCardData = InferSelectModel<
  typeof drizzleCreditCardTable
>;

export type DrizzleCreditCardDataCreate = InferInsertModel<
  typeof drizzleCreditCardTable
>;

export const drizzleCreditCardTable = ddl.pgTable("credit_cards", {
  id: ddl.uuid("id").primaryKey(),
  bankAccountId: ddl
    .uuid("bank_account_id")
    .notNull()
    .references(() => drizzleBankAccountTable.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  slug: ddl.varchar("slug").notNull(),
  name: ddl.varchar("name").notNull(),
  limit: customMoneyType("limit").notNull(),
  invoiceClosingDay: ddl.integer("invoice_closing_day").notNull(),
  invoiceDueDay: ddl.integer("invoice_due_day").notNull(),
  isMainCard: ddl.boolean("is_main_card").notNull(),
  updatedAt: ddl.timestamp("updated_at", { withTimezone: true }),
  createdAt: ddl.timestamp("created_at", { withTimezone: true }).notNull(),
} satisfies Record<keyof CreditCardData, ddl.PgColumnBuilderBase>);
