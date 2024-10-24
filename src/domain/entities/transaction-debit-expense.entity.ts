import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import {
  TransactionDebitExpenseEntitySchema,
  TransactionDebitExpenseSchemaToCreate,
} from "./schemas/transaction-debit-expense.schema";
import { TransactionData } from "./transaction.entity";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type TransactionDebitExpense = EntityInstance<
  TransactionDebitExpenseData,
  TransactionDebitExpenseEntity
>;

export type TransactionDebitExpenseData = TransactionData & {
  bankAccountId: UniqueEntityId;
  transactionCategoryId: UniqueEntityId;
  accomplishedAt: Date | null;
};

export type TransactionDebitExpenseDataCreateInput = Omit<
  EntityDataCreateInput<
    TransactionDebitExpenseData,
    TransactionDebitExpenseSchemaToCreate
  >,
  "categoryName" | "accomplishedAt"
>;

export class TransactionDebitExpenseEntity extends Entity<TransactionDebitExpenseData> {
  static readonly schema = TransactionDebitExpenseEntitySchema;

  static create(input: TransactionDebitExpenseDataCreateInput) {
    return new this().createEntity({
      recurrencePeriod: null,
      recurrenceInterval: null,
      recurrenceLimit: null,
      recurrenceOccurrence: null,
      updatedAt: null,
      createdAt: new Date(),
      ...input,
      id: new UniqueEntityId(input.id),
      bankAccountId: new UniqueEntityId(input.bankAccountId),
      transactionCategoryId: new UniqueEntityId(input.transactionCategoryId),
      recurrenceOriginId: input.recurrenceOriginId
        ? new UniqueEntityId(input.recurrenceOriginId)
        : null,
      accomplishedAt: input.isAccomplished ? new Date() : null,
    });
  }
}
