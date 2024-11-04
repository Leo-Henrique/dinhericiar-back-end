import { z } from "zod";

export type TransactionRecurrenceFixedSchemaToCreate = z.infer<
  typeof TransactionRecurrenceFixedEntitySchema.toCreate
>;

export class TransactionRecurrenceFixedEntitySchema {
  static get toCreate() {
    return z.object({
      fixedPeriod: z.enum(["YEAR", "MONTH", "WEEK"]),
      fixedInterval: z.number().int().positive(),
      fixedOccurrences: z
        .array(z.number().int().positive())
        .min(1)
        .transform(val => [...new Set(val)])
        .nullable(),
    });
  }

  static occurrencesValidator(
    { fixedPeriod, fixedOccurrences }: TransactionRecurrenceFixedSchemaToCreate,
    ctx: z.RefinementCtx,
  ) {
    if (!fixedOccurrences) return z.NEVER;

    const months = Array.from({ length: 12 }).map((_, index) => index + 1);
    const daysFromMonth = Array.from({ length: 31 }).map(
      (_, index) => index + 1,
    );
    const daysFromWeek = Array.from({ length: 7 }).map((_, index) => index + 1);

    const isInvalidOccurrenceFromYearPeriod = fixedOccurrences.some(
      occurrence => {
        return !months.includes(occurrence);
      },
    );

    if (fixedPeriod === "YEAR" && isInvalidOccurrenceFromYearPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No período anual, apenas números do mês são válidos como ocorrência na transação fixa.",
        fatal: true,
        path: ["fixedOccurrences"],
      });

      return z.NEVER;
    }

    const isInvalidOccurrenceFromMonthPeriod = fixedOccurrences.some(
      occurrence => {
        return !daysFromMonth.includes(occurrence);
      },
    );

    if (fixedPeriod === "MONTH" && isInvalidOccurrenceFromMonthPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No período mensal, apenas dias do mês são válidos como ocorrência na transação fixa.",
        fatal: true,
        path: ["fixedOccurrences"],
      });

      return z.NEVER;
    }

    const isInvalidOccurrenceFromWeekPeriod = fixedOccurrences.some(
      occurrence => {
        return !daysFromWeek.includes(occurrence);
      },
    );

    if (fixedPeriod === "WEEK" && isInvalidOccurrenceFromWeekPeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "No período semanal, apenas dias da semana são válidos como ocorrência na transação fixa.",
        fatal: true,
        path: ["fixedOccurrences"],
      });

      return z.NEVER;
    }
  }
}
