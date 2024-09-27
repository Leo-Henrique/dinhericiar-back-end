import {
  EntityDataCreateInput,
  EntityDataUpdateInput,
  EntityInstance,
} from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import {
  UserEntitySchema,
  UserSchemaToCreate,
  UserSchemaToUpdate,
} from "./schemas/user.schema";
import { Email } from "./value-objects/email";
import { Name } from "./value-objects/name";
import { Password } from "./value-objects/password";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type User = EntityInstance<UserData, UserEntity>;

export type UserData = {
  id: UniqueEntityId;
  email: Email;
  password: Password;
  name: Name;
  activatedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date;
};

export type UserDataCreateInput = EntityDataCreateInput<
  UserData,
  UserSchemaToCreate
>;

export type UserDataUpdateInput = EntityDataUpdateInput<
  UserData,
  UserSchemaToUpdate
>;

export class UserEntity extends Entity<UserData> {
  static readonly schema = UserEntitySchema;

  static create(input: UserDataCreateInput) {
    return new this().createEntity({
      updatedAt: null,
      createdAt: new Date(),
      activatedAt: null,
      ...input,
      id: new UniqueEntityId(input.id),
      email: new Email(input.email),
      password: new Password(input.password),
      name: new Name(input.name),
    });
  }

  update<Input extends UserDataUpdateInput>(input: Input) {
    return this.updateEntity({
      ...input,
      email: input.email ? new Email(input.email) : undefined,
      password: input.password ? new Password(input.password) : undefined,
      name: input.name ? new Name(input.name) : undefined,
    });
  }
}
