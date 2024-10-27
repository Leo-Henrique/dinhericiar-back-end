import { z } from "zod";

export type TransactionRecurrenceInstallmentSchemaToCreate = z.infer<
  typeof TransactionRecurrenceInstallmentEntitySchema.toCreate
>;

export class TransactionRecurrenceInstallmentEntitySchema {
  static get toCreate() {
    return z.object({
      installmentPeriod: z.enum(["YEAR", "MONTH", "WEEK"]),
      installmentNumber: z.number().int().positive(),
    });
  }
}
