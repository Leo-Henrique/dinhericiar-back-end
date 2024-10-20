import {
  EntityDataCreateInput,
  EntityDataUpdateInput,
  EntityInstance,
} from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import {
  CreditCardEntitySchema,
  CreditCardSchemaToCreate,
  CreditCardSchemaToUpdate,
} from "./schemas/credit-card.schema";
import { Name } from "./value-objects/name";
import { Slug } from "./value-objects/slug";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type CreditCard = EntityInstance<CreditCardData, CreditCardEntity>;

export type CreditCardData = {
  id: UniqueEntityId;
  bankAccountId: UniqueEntityId;
  slug: Slug;
  name: string;
  limit: number;
  invoiceClosingDay: number;
  invoiceDueDay: number;
  isMainCard: boolean;
  updatedAt: Date | null;
  createdAt: Date;
};

export type CreditCardDataCreateInput = EntityDataCreateInput<
  CreditCardData,
  CreditCardSchemaToCreate,
  {
    isMainCard?: boolean;
  }
>;

export type CreditCardDataUpdateInput = Omit<
  EntityDataUpdateInput<CreditCardData, CreditCardSchemaToUpdate>,
  "slug"
>;

export class CreditCardEntity extends Entity<CreditCardData> {
  static readonly schema = CreditCardEntitySchema;

  static create(input: CreditCardDataCreateInput) {
    const name = new Name(input.name);

    return new this().createEntity({
      updatedAt: null,
      createdAt: new Date(),
      isMainCard: false,
      ...input,
      id: new UniqueEntityId(input.id),
      bankAccountId: new UniqueEntityId(input.bankAccountId),
      slug: input.slug ? new Slug(input.slug) : Slug.createFromText(name.value),
    });
  }

  update<Input extends CreditCardDataUpdateInput>(input: Input) {
    return this.updateEntity({
      ...input,
      bankAccountId: input.bankAccountId
        ? new UniqueEntityId(input.bankAccountId)
        : undefined,
      slug: input.name ? Slug.createFromText(input.name) : undefined,
    });
  }
}
