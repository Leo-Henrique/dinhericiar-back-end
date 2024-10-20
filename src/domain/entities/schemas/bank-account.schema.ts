import { z } from "zod";

export type BankAccountSchemaToCreate = z.infer<
  typeof BankAccountEntitySchema.toCreate
>;

export type BankAccountSchemaToUpdate = z.infer<
  typeof BankAccountEntitySchema.toUpdate
>;

export class BankAccountEntitySchema {
  static get toCreate() {
    return z.object({
      institution: z.string().trim().min(1).max(255),
      name: z.string().trim().min(1).max(255),
      balance: z.number().nonnegative(),
      isMainAccount: z.boolean(),
    });
  }

  static get toUpdate() {
    return this.toCreate.partial();
  }
}
