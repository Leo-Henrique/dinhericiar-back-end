import { TransactionRecurrenceFixedData } from "@/domain/entities/transaction-recurrence-fixed.entity";
import { TransactionRecurrenceInstallmentData } from "@/domain/entities/transaction-recurrence-installment.entity";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";

export type DrizzleTransactionRecurrenceData = InferSelectModel<
  typeof drizzleTransactionRecurrenceTable
>;

export type DrizzleTransactionRecurrenceDataCreate = InferInsertModel<
  typeof drizzleTransactionRecurrenceTable
>;

export const drizzleTransactionRecurrenceTypesEnum = ddl.pgEnum(
  "transaction_recurrence_types",
  ["INSTALLMENT", "FIXED"],
);

export const drizzleTransactionRecurrencePeriodsEnum = ddl.pgEnum(
  "transaction_recurrence_periods",
  ["YEAR", "MONTH", "WEEK"],
);

type TransactionRecurrenceFields =
  | keyof TransactionRecurrenceInstallmentData
  | keyof TransactionRecurrenceFixedData
  | "type";

export const drizzleTransactionRecurrenceTable = ddl.pgTable(
  "transaction_recurrences",
  {
    id: ddl.uuid("id").primaryKey(),
    type: drizzleTransactionRecurrenceTypesEnum("type").notNull(),
    period: drizzleTransactionRecurrencePeriodsEnum("period").notNull(),
    installments: ddl.integer("installments"),
    interval: ddl.integer("interval"),
    occurrences: ddl.integer("occurrences").array(),
  } satisfies Record<TransactionRecurrenceFields, ddl.PgColumnBuilderBase>,
  table => ({
    typeConstraint: ddl.check(
      "type_constraint",
      sql`
        (
          ${table.type} = 'INSTALLMENT' 
        AND 
          ${table.installments} IS NOT NULL
        AND 
          ${table.interval} IS NULL
        AND 
          ${table.occurrences} IS NULL
        ) 
        OR (
          ${table.type} = 'FIXED'
        AND 
          ${table.installments} IS NULL
        AND 
          ${table.interval} IS NOT NULL
        AND 
          ${table.occurrences} IS NOT NULL
        )
      `,
    ),
  }),
);
