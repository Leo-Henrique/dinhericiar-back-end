import { ZodRestrictFieldsShape } from "@/core/@types/schema";
import { z } from "zod";
import { CreditCardData } from "../credit-card.entity";
import { UniqueEntityId } from "../value-objects/unique-entity.id";

export type CreditCardSchemaToCreate = z.infer<
  typeof CreditCardEntitySchema.toCreate
>;

export type CreditCardSchemaToUpdate = z.infer<
  typeof CreditCardEntitySchema.toUpdate
>;

export class CreditCardEntitySchema {
  static get toCreate() {
    return z.object({
      bankAccountId: UniqueEntityId.schema,
      name: z.string().trim().min(1).max(255),
      limit: z.number().nonnegative(),
      invoiceClosingDay: z.number().int().positive().min(1).max(31),
      invoiceDueDay: z.number().int().positive().min(1).max(31),
      isMainCard: z.boolean(),
    } satisfies ZodRestrictFieldsShape<CreditCardData>);
  }

  static get toUpdate() {
    return this.toCreate.partial();
  }
}
