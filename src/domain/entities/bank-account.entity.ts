import {
  EntityDataCreateInput,
  EntityDataUpdateInput,
  EntityInstance,
} from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import {
  BankAccountEntitySchema,
  BankAccountSchemaToCreate,
  BankAccountSchemaToUpdate,
} from "./schemas/bank-account.schema";
import { Name } from "./value-objects/name";
import { Slug } from "./value-objects/slug";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type BankAccount = EntityInstance<BankAccountData, BankAccountEntity>;

export type BankAccountData = {
  id: UniqueEntityId;
  userId: UniqueEntityId;
  slug: Slug;
  institution: Name;
  name: Name;
  balance: number;
  isMainAccount: boolean;
  inactivatedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date;
};

export type BankAccountDataCreateInput = EntityDataCreateInput<
  BankAccountData,
  BankAccountSchemaToCreate,
  {
    userId: string;
    isMainAccount?: boolean;
  }
>;

export type BankAccountDataUpdateInput = Omit<
  EntityDataUpdateInput<BankAccountData, BankAccountSchemaToUpdate>,
  "userId" | "slug"
>;

export class BankAccountEntity extends Entity<BankAccountData> {
  static readonly schema = BankAccountEntitySchema;

  static create(input: BankAccountDataCreateInput) {
    const name = new Name(input.name);

    return new this().createEntity({
      updatedAt: null,
      createdAt: new Date(),
      inactivatedAt: null,
      isMainAccount: false,
      ...input,
      id: new UniqueEntityId(input.id),
      userId: new UniqueEntityId(input.userId),
      slug: input.slug ? new Slug(input.slug) : Slug.createFromText(name.value),
      institution: new Name(input.institution),
      name: name,
    });
  }

  update<Input extends BankAccountDataUpdateInput>(input: Input) {
    return this.updateEntity({
      ...input,
      institution: input.institution ? new Name(input.institution) : undefined,
      name: input.name ? new Name(input.name) : undefined,
      slug: input.name ? Slug.createFromText(input.name) : undefined,
    });
  }
}
