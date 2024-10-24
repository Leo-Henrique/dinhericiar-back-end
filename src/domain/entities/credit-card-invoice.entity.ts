import {
  EntityDataCreateInput,
  EntityDataUpdateInput,
  EntityInstance,
} from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type CreditCardInvoice = EntityInstance<
  CreditCardInvoiceData,
  CreditCardInvoiceEntity
>;

export type CreditCardInvoiceData = {
  id: UniqueEntityId;
  creditCardId: UniqueEntityId;
  year: number;
  month: number;
  accomplishedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date;
};

export type CreditCardInvoiceDataCreateInput = SetRequired<
  EntityDataCreateInput<CreditCardInvoiceData>,
  "creditCardId" | "year" | "month"
>;

export type CreditCardInvoiceDataUpdateInput = Omit<
  EntityDataUpdateInput<CreditCardInvoiceData>,
  "creditCardId" | "year" | "month"
>;

export class CreditCardInvoiceEntity extends Entity<CreditCardInvoiceData> {
  static create(input: CreditCardInvoiceDataCreateInput) {
    return new this().createEntity({
      updatedAt: null,
      createdAt: new Date(),
      accomplishedAt: null,
      ...input,
      id: new UniqueEntityId(input.id),
      creditCardId: new UniqueEntityId(input.creditCardId),
    });
  }

  update<Input extends CreditCardInvoiceDataUpdateInput>(input: Input) {
    return this.updateEntity(input);
  }
}
