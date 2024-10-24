import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import {
  TransactionCreditExpenseEntitySchema,
  TransactionCreditExpenseSchemaToCreate,
} from "./schemas/transaction-credit-expense.schema";
import { TransactionData } from "./transaction.entity";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type CreditExpenseTransaction = EntityInstance<
  CreditExpenseTransactionData,
  TransactionCreditExpenseEntity
>;

export type CreditExpenseTransactionData = TransactionData & {
  creditCardInvoiceId: UniqueEntityId;
  transactionCategoryId: UniqueEntityId;
};

export type CreditExpenseTransactionDataCreateInput = Omit<
  EntityDataCreateInput<
    CreditExpenseTransactionData,
    TransactionCreditExpenseSchemaToCreate
  >,
  "categoryName"
>;

export class TransactionCreditExpenseEntity extends Entity<CreditExpenseTransactionData> {
  static readonly schema = TransactionCreditExpenseEntitySchema;

  static create(input: CreditExpenseTransactionDataCreateInput) {
    return new this().createEntity({
      recurrencePeriod: null,
      recurrenceInterval: null,
      recurrenceLimit: null,
      recurrenceOccurrence: null,
      updatedAt: null,
      createdAt: new Date(),
      ...input,
      id: new UniqueEntityId(input.id),
      creditCardInvoiceId: new UniqueEntityId(input.creditCardInvoiceId),
      transactionCategoryId: new UniqueEntityId(input.transactionCategoryId),
      recurrenceOriginId: input.recurrenceOriginId
        ? new UniqueEntityId(input.recurrenceOriginId)
        : null,
    });
  }
}
