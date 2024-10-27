import { Entity } from "@/core/entities/entity";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type TransactionData = {
  id: UniqueEntityId;
  transactionRecurrenceId: UniqueEntityId | null;
  transactedAt: Date;
  description: string;
  amount: number;
  updatedAt: Date | null;
  createdAt: Date;
};

export abstract class TransactionEntity<
  Data extends TransactionData,
> extends Entity<Data> {}
