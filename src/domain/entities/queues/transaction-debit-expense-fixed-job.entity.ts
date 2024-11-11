import {
  EntityDataCreateInput,
  EntityDataRaw,
  EntityInstance,
} from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetNonNullable, SetRequired } from "type-fest";
import { TransactionDebitExpenseData } from "../transaction-debit-expense.entity";
import { UniqueEntityId } from "../value-objects/unique-entity.id";

export type TransactionDebitExpenseFixedJob = EntityInstance<
  TransactionDebitExpenseFixedJobData,
  TransactionDebitExpenseFixedJobEntity
>;

export type TransactionDebitExpenseFixedJobData = SetNonNullable<
  Omit<
    TransactionDebitExpenseData,
    "accomplishedAt" | "transactedAt" | "createdByQueue"
  >,
  "transactionRecurrenceId"
>;

export type TransactionDebitExpenseFixedJobRawData =
  EntityDataRaw<TransactionDebitExpenseFixedJobData>;

export type TransactionDebitExpenseFixedJobDataCreateInput = SetRequired<
  EntityDataCreateInput<TransactionDebitExpenseFixedJobData>,
  | "transactionRecurrenceId"
  | "transactionCategoryId"
  | "bankAccountId"
  | "amount"
  | "description"
>;

export class TransactionDebitExpenseFixedJobEntity extends Entity<TransactionDebitExpenseFixedJobData> {
  static create(input: TransactionDebitExpenseFixedJobDataCreateInput) {
    return new this().createEntity({
      updatedAt: null,
      createdAt: new Date(),
      ...input,
      id: new UniqueEntityId(input.id),
      bankAccountId: new UniqueEntityId(input.bankAccountId),
      transactionCategoryId: new UniqueEntityId(input.transactionCategoryId),
      transactionRecurrenceId: new UniqueEntityId(
        input.transactionRecurrenceId,
      ),
    });
  }
}
