import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import {
  TransactionCategoryEntitySchema,
  TransactionCategorySchemaToCreate,
  TransactionCategorySchemaToUpdate,
} from "./schemas/transaction-category.schema";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type TransactionCategory = EntityInstance<
  TransactionCategoryData,
  TransactionCategoryEntity
>;

export type TransactionCategoryData = {
  id: UniqueEntityId;
  userId: UniqueEntityId;
  transactionType: "EXPENSE" | "EARNING";
  name: string;
  updatedAt: Date | null;
  createdAt: Date;
};

export type TransactionCategoryDataCreateInput = EntityDataCreateInput<
  TransactionCategoryData,
  TransactionCategorySchemaToCreate
>;

export type TransactionCategoryDataUpdateInput =
  TransactionCategorySchemaToUpdate;

export class TransactionCategoryEntity extends Entity<TransactionCategoryData> {
  static readonly schema = TransactionCategoryEntitySchema;

  static create(input: TransactionCategoryDataCreateInput) {
    return new this().createEntity({
      updatedAt: null,
      createdAt: new Date(),
      ...input,
      id: new UniqueEntityId(input.id),
      userId: new UniqueEntityId(input.userId),
    });
  }

  update<Input extends TransactionCategoryDataUpdateInput>(input: Input) {
    return this.updateEntity({
      ...input,
    });
  }
}
