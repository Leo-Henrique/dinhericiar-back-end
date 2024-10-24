import { ZodRestrictFieldsShape } from "@/core/@types/schema";
import { z } from "zod";
import { TransactionCategoryData } from "../transaction-category.entity";

export type TransactionCategorySchemaToCreate = z.infer<
  typeof TransactionCategoryEntitySchema.toCreate
>;

export type TransactionCategorySchemaToUpdate = z.infer<
  typeof TransactionCategoryEntitySchema.toUpdate
>;

export class TransactionCategoryEntitySchema {
  static get toCreate() {
    return z.object({
      transactionType: z.enum(["EXPENSE", "EARNING"]),
      name: z.string().min(1).max(255),
    } satisfies ZodRestrictFieldsShape<TransactionCategoryData>);
  }

  static get toUpdate() {
    return this.toCreate.pick({ name: true }).partial();
  }
}
