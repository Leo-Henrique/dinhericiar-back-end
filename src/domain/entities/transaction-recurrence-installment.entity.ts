import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { TransactionRecurrenceInstallmentEntitySchema } from "./schemas/transaction-recurrence-installment.schema";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type TransactionRecurrenceInstallment = EntityInstance<
  TransactionRecurrenceInstallmentData,
  TransactionRecurrenceInstallmentEntity
>;

export type TransactionRecurrenceInstallmentData = {
  id: UniqueEntityId;
  period: "YEAR" | "MONTH" | "WEEK";
  installments: number;
};

export type TransactionRecurrenceInstallmentDataCreateInput = SetRequired<
  EntityDataCreateInput<TransactionRecurrenceInstallmentData>,
  "period" | "installments"
>;

export class TransactionRecurrenceInstallmentEntity extends Entity<TransactionRecurrenceInstallmentData> {
  static readonly schema = TransactionRecurrenceInstallmentEntitySchema;

  static create(input: TransactionRecurrenceInstallmentDataCreateInput) {
    return new this().createEntity({
      ...input,
      id: new UniqueEntityId(input.id),
    });
  }
}
