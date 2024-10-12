import { z } from "zod";
import { Name } from "../value-objects/name";

export type BankAccountSchemaToCreate = z.infer<
  typeof BankAccountEntitySchema.toCreate
>;

export type BankAccountSchemaToUpdate = z.infer<
  typeof BankAccountEntitySchema.toUpdate
>;

export class BankAccountEntitySchema {
  static get toCreate() {
    return z.object({
      institution: Name.schema,
      name: z.string().trim().max(255),
      balance: z.number().nonnegative(),
      isMainAccount: z.boolean(),
    });
  }

  static get toUpdate() {
    return this.toCreate.partial();
  }
}
