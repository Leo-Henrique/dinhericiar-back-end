import { z } from "zod";
import { UniqueEntityId } from "../value-objects/unique-entity.id";
import { TransactionCategoryEntitySchema } from "./transaction-category.schema";
import {
  TransactionEntitySchema,
  TransactionSchemaRecurrence,
} from "./transaction.schema";

type TransactionCreditExpenseSchemaBase = z.infer<
  typeof TransactionCreditExpenseEntitySchema.base
>;

export type TransactionCreditExpenseSchemaToCreate =
  | TransactionCreditExpenseSchemaBase
  | (TransactionCreditExpenseSchemaBase &
      Required<TransactionSchemaRecurrence>);

export class TransactionCreditExpenseEntitySchema {
  static get base() {
    return TransactionEntitySchema.base.extend({
      creditCardInvoiceId: UniqueEntityId.schema,
      categoryName: TransactionCategoryEntitySchema.toCreate.shape.name,
    });
  }

  static get toCreate() {
    return this.base
      .merge(TransactionEntitySchema.recurrence)
      .superRefine(TransactionEntitySchema.recurrenceValidator)
      .superRefine(TransactionEntitySchema.recurrenceOccurrenceValidator);
  }
}
