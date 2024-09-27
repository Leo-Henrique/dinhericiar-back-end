import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { UserActivationTokenEntitySchema } from "./schemas/user-activation-token.schema";
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

export type UserActivationTokenDataCreateInput = SetRequired<
  EntityDataCreateInput<UserActivationTokenData>,
  "userId" | "token"
>;

export class UserActivationTokenEntity extends Entity<UserActivationTokenData> {
  static readonly schema = UserActivationTokenEntitySchema;

  static create(input: UserActivationTokenDataCreateInput) {
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
