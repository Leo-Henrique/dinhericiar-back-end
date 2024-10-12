import { BankAccountData } from "@/domain/entities/bank-account.entity";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";
import { drizzleUserTable } from "./drizzle-user.schema";
import { customMoneyType } from "./utils";

export type DrizzleBankAccountData = InferSelectModel<
  typeof drizzleBankAccountTable
>;

export type DrizzleBankAccountDataCreate = InferInsertModel<
  typeof drizzleBankAccountTable
>;

export const drizzleBankAccountTable = ddl.pgTable(
  "bank_accounts",
  {
    id: ddl.uuid("id").primaryKey(),
    userId: ddl
      .uuid("user_id")
      .notNull()
      .references(() => drizzleUserTable.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    slug: ddl.varchar("slug").notNull(),
    institution: ddl.varchar("institution").notNull(),
    name: ddl.varchar("name").notNull(),
    balance: customMoneyType("balance").notNull(),
    isMainAccount: ddl.boolean("is_main_account").notNull(),
    inactivatedAt: ddl.timestamp("inactivated_at", { withTimezone: true }),
    updatedAt: ddl.timestamp("updated_at", { withTimezone: true }),
    createdAt: ddl.timestamp("created_at", { withTimezone: true }).notNull(),
  } satisfies Record<keyof BankAccountData, ddl.PgColumnBuilderBase>,
  table => ({
    uniqueSlugPerUser: ddl.unique().on(table.userId, table.slug),
    uniqueInstitutionPerUser: ddl.unique().on(table.userId, table.institution),
    uniqueNamePerUser: ddl.unique().on(table.userId, table.name),
  }),
);
