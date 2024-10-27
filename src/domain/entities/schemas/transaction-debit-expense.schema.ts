import { z } from "zod";
import { UniqueEntityId } from "../value-objects/unique-entity.id";
import { TransactionCategoryEntitySchema } from "./transaction-category.schema";
import { TransactionRecurrenceFixedEntitySchema } from "./transaction-recurrence-fixed.schema";
import { TransactionRecurrenceInstallmentEntitySchema } from "./transaction-recurrence-installment.schema";
import { TransactionEntitySchema } from "./transaction.schema";

export type TransactionDebitExpenseSchemaToCreateUnique = z.infer<
  typeof TransactionDebitExpenseEntitySchema.toCreateUnique
>;

export type TransactionDebitExpenseSchemaToCreateInstallment = z.infer<
  typeof TransactionDebitExpenseEntitySchema.toCreateInstallment
>;

export type TransactionDebitExpenseSchemaToCreateFixed = z.infer<
  typeof TransactionDebitExpenseEntitySchema.toCreateFixed
>;

export class TransactionDebitExpenseEntitySchema {
  static get toCreateUnique() {
    return TransactionEntitySchema.toCreate.extend({
      bankAccountId: UniqueEntityId.schema,
      categoryName: TransactionCategoryEntitySchema.toCreate.shape.name,
      isAccomplished: z.boolean(),
    });
  }

  static get toCreateInstallment() {
    return this.toCreateUnique.merge(
      TransactionRecurrenceInstallmentEntitySchema.toCreate,
    );
  }

  static get toCreateFixed() {
    return this.toCreateUnique
      .merge(TransactionRecurrenceFixedEntitySchema.toCreate)
      .superRefine(TransactionRecurrenceFixedEntitySchema.occurrencesValidator);
  }
}
