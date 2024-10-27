import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { TransactionRecurrenceFixedEntitySchema } from "./schemas/transaction-recurrence-fixed.schema";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type TransactionRecurrenceFixed = EntityInstance<
  TransactionRecurrenceFixedData,
  TransactionRecurrenceFixedEntity
>;

export type TransactionRecurrenceFixedData = {
  id: UniqueEntityId;
  period: "YEAR" | "MONTH" | "WEEK";
  interval: number;
  occurrences: number[] | null;
};

export type TransactionRecurrenceFixedDataCreateInput = SetRequired<
  EntityDataCreateInput<TransactionRecurrenceFixedData>,
  "period" | "interval" | "occurrences"
>;

export class TransactionRecurrenceFixedEntity extends Entity<TransactionRecurrenceFixedData> {
  static readonly schema = TransactionRecurrenceFixedEntitySchema;

  static create(input: TransactionRecurrenceFixedDataCreateInput) {
    return new this().createEntity({
      ...input,
      id: new UniqueEntityId(input.id),
    });
  }
}
