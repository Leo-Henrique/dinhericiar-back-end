import { EntityDataCreateInput, EntityInstance } from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { UserPasswordResetTokenEntitySchema } from "./schemas/user-password-reset-token.schema";
import { Token } from "./value-objects/token";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

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
    const { tokenDefaultDurationInMilliseconds } = UserPasswordResetTokenEntity;

    return new this().createEntity({
      expiresAt: new Date(Date.now() + tokenDefaultDurationInMilliseconds),
      ...input,
      userId: new UniqueEntityId(input.userId),
      token: new Token(input.token),
    });
  }

  public static get tokenBytes() {
    return 64 as const;
  }

  public static get tokenDefaultDurationInMilliseconds() {
    return 1000 * 60 * 15; // 15 minutes
  }
}
