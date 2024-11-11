import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import {
  TransactionDebitExpenseEntitySchema,
  TransactionDebitExpenseSchemaToCreateUnique,
} from "./schemas/transaction-debit-expense.schema";
import { TransactionData, TransactionEntity } from "./transaction.entity";
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
    TransactionDebitExpenseSchemaToCreateUnique
  >,
  "categoryName" | "isAccomplished"
>;

export class TransactionDebitExpenseEntity extends TransactionEntity<TransactionDebitExpenseData> {
  static readonly schema = TransactionDebitExpenseEntitySchema;

  static create(input: TransactionDebitExpenseDataCreateInput) {
    return new this().createEntity({
      updatedAt: null,
      createdAt: new Date(),
      createdByQueue: false,
      accomplishedAt: null,
      ...input,
      id: new UniqueEntityId(input.id),
      bankAccountId: new UniqueEntityId(input.bankAccountId),
      transactionCategoryId: new UniqueEntityId(input.transactionCategoryId),
      transactionRecurrenceId: input.transactionRecurrenceId
        ? new UniqueEntityId(input.transactionRecurrenceId)
        : null,
    });
  }
}
