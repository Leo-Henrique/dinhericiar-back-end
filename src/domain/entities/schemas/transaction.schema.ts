import { ZodRestrictFieldsShape } from "@/core/@types/schema";
import { z } from "zod";
import { TransactionData } from "../transaction.entity";

export type TransactionSchemaToCreate = z.infer<
  typeof TransactionEntitySchema.toCreate
>;

export class TransactionEntitySchema {
  static get toCreate() {
    return z.object({
      transactedAt: z
        .string()
        .datetime()
        .transform(val => new Date(val)),
      description: z.string().trim().min(1).max(255),
      amount: z.number().positive(),
    } satisfies ZodRestrictFieldsShape<TransactionData>);
  }
}
