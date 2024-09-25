import {
  EntityDataCreateInput,
  EntityDataUpdateInput,
  EntityInstance,
} from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { z } from "zod";
import { UserEntitySchema } from "./schemas/user.schema";
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

export type UserDataCreateInput = z.infer<typeof UserEntity.schema.create>;

export type UserDataDomainCreateInput = EntityDataCreateInput<
  UserData,
  UserDataCreateInput
>;

export type UserDataUpdateInput = z.infer<typeof UserEntity.schema.update>;

export type UserDataDomainUpdateInput = EntityDataUpdateInput<
  UserData,
  UserDataUpdateInput
>;

export class UserEntity extends Entity<UserData> {
  static schema = new UserEntitySchema();

  static create(input: UserDataDomainCreateInput) {
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

  update<Input extends UserDataDomainUpdateInput>(input: Input) {
    return this.updateEntity({
      ...input,
      email: input.email ? new Email(input.email) : undefined,
      password: input.password ? new Password(input.password) : undefined,
      name: input.name ? new Name(input.name) : undefined,
    });
  }
}
