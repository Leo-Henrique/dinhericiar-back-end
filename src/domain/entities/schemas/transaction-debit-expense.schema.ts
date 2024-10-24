import { z } from "zod";
import { UniqueEntityId } from "../value-objects/unique-entity.id";
import { TransactionCategoryEntitySchema } from "./transaction-category.schema";
import {
  TransactionEntitySchema,
  TransactionSchemaRecurrence,
} from "./transaction.schema";

type TransactionDebitExpenseSchemaBase = z.infer<
  typeof TransactionDebitExpenseEntitySchema.base
>;

export type TransactionDebitExpenseSchemaToCreate =
  | TransactionDebitExpenseSchemaBase
  | (TransactionDebitExpenseSchemaBase & Required<TransactionSchemaRecurrence>);

export class TransactionDebitExpenseEntitySchema {
  static get base() {
    return TransactionEntitySchema.base.extend({
      bankAccountId: UniqueEntityId.schema,
      categoryName: TransactionCategoryEntitySchema.toCreate.shape.name,
      isAccomplished: z.boolean(),
    });
  }

  static get toCreate() {
    return this.base
      .merge(TransactionEntitySchema.recurrence)
      .superRefine(TransactionEntitySchema.recurrenceValidator)
      .superRefine(TransactionEntitySchema.recurrenceOccurrenceValidator);
  }
}
