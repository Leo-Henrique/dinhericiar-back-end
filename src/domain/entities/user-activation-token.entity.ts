import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { Token } from "./value-objects/token";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type UserActivationToken = EntityInstance<
  UserActivationTokenData,
  UserActivationTokenEntity
>;

export type UserActivationTokenData = {
  userId: UniqueEntityId;
  token: Token;
  expiresAt: Date;
};

export type UserActivationTokenDataDomainCreateInput = SetRequired<
  EntityDataCreateInput<UserActivationTokenData>,
  "userId" | "token"
>;

export class UserActivationTokenEntity extends Entity<UserActivationTokenData> {
  static create(input: UserActivationTokenDataDomainCreateInput) {
    const fifteenMinutesInMilliseconds = 1000 * 60 * 15;

    return new this().createEntity({
      expiresAt: new Date(Date.now() + fifteenMinutesInMilliseconds),
      ...input,
      userId: new UniqueEntityId(input.userId),
      token: new Token(input.token),
    });
  }

  public static get tokenBytes() {
    return 64 as const;
  }
}
