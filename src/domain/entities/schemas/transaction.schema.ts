import { ZodRestrictFieldsShape } from "@/core/@types/schema";
import { z } from "zod";
import { TransactionData } from "../transaction.entity";

export type TransactionSchemaBase = z.infer<
  typeof TransactionEntitySchema.base
>;

export type TransactionSchemaRecurrence = z.infer<
  typeof TransactionEntitySchema.recurrence
>;

export class TransactionEntitySchema {
  static get base() {
    return z.object({
      transactedAt: z
        .string()
        .datetime()
        .transform(val => new Date(val)),
      description: z.string().trim().min(1).max(255),
      amount: z.number().positive(),
    });
  }

  static get recurrence() {
    return z.object({
      recurrencePeriod: z.enum(["YEAR", "MONTH", "WEEK"]).optional(),
      recurrenceInterval: z.number().int().positive().optional(),
      recurrenceLimit: z.number().int().positive().nullable().optional(),
      recurrenceOccurrence: z
        .array(z.number().int().positive())
        .min(1)
        .transform(val => [...new Set(val)])
        .optional(),
    } satisfies ZodRestrictFieldsShape<TransactionData>);
  }

  static recurrenceValidator(
    value:
      | TransactionSchemaBase
      | (TransactionSchemaBase & TransactionSchemaRecurrence),
    ctx: z.RefinementCtx,
  ) {
    const inputFieldNames = Object.keys(value);
    const recurrenceFieldNames = Object.keys(
      TransactionEntitySchema.recurrence.shape,
    );
    let hasAnyRecurrenceField = false;

    for (const inputFieldName of inputFieldNames) {
      if (recurrenceFieldNames.includes(inputFieldName)) {
        hasAnyRecurrenceField = true;
        break;
      }
    }

    if (!hasAnyRecurrenceField) return z.NEVER;

    const missingRecurrenceFields = [];

    for (const recurrenceFieldName of recurrenceFieldNames) {
      if (!inputFieldNames.includes(recurrenceFieldName))
        missingRecurrenceFields.push(recurrenceFieldName);
    }

    for (const missingField of missingRecurrenceFields) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Em uma transação recorrente todos os campos da recorrência são obrigatórios.",
        fatal: true,
        path: [missingField],
      });
    }
  }

  static recurrenceOccurrenceValidator(
    {
      recurrencePeriod,
      recurrenceOccurrence,
    }: TransactionSchemaBase & TransactionSchemaRecurrence,
    ctx: z.RefinementCtx,
  ) {
    if (!recurrenceOccurrence) return z.NEVER;

    const months = Array.from({ length: 12 }).map((_, index) => index + 1);
    const daysFromMonth = Array.from({ length: 31 }).map(
      (_, index) => index + 1,
    );
    const daysFromWeek = Array.from({ length: 7 }).map((_, index) => index + 1);

    const isInvalidOccurrenceFromYearPeriod = recurrenceOccurrence.some(
      occurrence => {
        return !months.includes(occurrence);
      },
    );

    if (recurrencePeriod === "YEAR" && isInvalidOccurrenceFromYearPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No período anual, apenas números do mês são válidos como ocorrência na transação recorrente.",
        fatal: true,
        path: ["recurrenceOccurrence"],
      });

      return z.NEVER;
    }

    const isInvalidOccurrenceFromMonthPeriod = recurrenceOccurrence.some(
      occurrence => {
        return !daysFromMonth.includes(occurrence);
      },
    );

    if (recurrencePeriod === "MONTH" && isInvalidOccurrenceFromMonthPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No período mensal, apenas dias do mês são válidos como ocorrência na transação recorrente.",
        fatal: true,
        path: ["recurrenceOccurrence"],
      });

      return z.NEVER;
    }

    const isInvalidOccurrenceFromWeekPeriod = recurrenceOccurrence.some(
      occurrence => {
        return !daysFromWeek.includes(occurrence);
      },
    );

    if (recurrencePeriod === "WEEK" && isInvalidOccurrenceFromWeekPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No período semanal, apenas dias da semana são válidos como ocorrência na transação recorrente.",
        fatal: true,
        path: ["recurrenceOccurrence"],
      });

      return z.NEVER;
    }
  }
}
