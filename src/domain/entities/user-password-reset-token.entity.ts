import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { Token } from "./value-objects/token";
import { UniqueEntityId } from "./value-objects/unique-entity.id";
import { UserPasswordResetTokenEntitySchema } from "./schemas/user-password-reset-token.schema";

export type UserPasswordResetToken = EntityInstance<
  UserPasswordResetTokenData,
  UserPasswordResetTokenEntity
>;

export type UserPasswordResetTokenData = {
  userId: UniqueEntityId;
  token: Token;
  expiresAt: Date;
};

export type UserPasswordResetTokenDataCreateInput = SetRequired<
  EntityDataCreateInput<UserPasswordResetTokenData>,
  "userId" | "token"
>;

export class UserPasswordResetTokenEntity extends Entity<UserPasswordResetTokenData> {
  static readonly schema = UserPasswordResetTokenEntitySchema;

  static create(input: UserPasswordResetTokenDataCreateInput) {
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

  public get tokenDurationInMilliseconds() {
    return this.data.expiresAt.getTime() - Date.now();
  }
}
