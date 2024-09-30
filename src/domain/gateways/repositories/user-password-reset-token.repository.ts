import { UserPasswordResetToken } from "@/domain/entities/user-password-reset-token.entity";
import { User } from "@/domain/entities/user.entity";

export abstract class UserPasswordResetTokenRepository {
  abstract createUnique(
    userPasswordResetToken: UserPasswordResetToken,
  ): Promise<void>;
  abstract findUniqueByTokenWithUser(
    token: string,
  ): Promise<UserPasswordResetTokenWithUser | null>;
  abstract resetUserPassword(
    user: User,
    userPasswordResetToken: UserPasswordResetToken,
    passwordHashed: string,
  ): Promise<void>;
}

export type UserPasswordResetTokenWithUser = {
  user: User;
  userPasswordResetToken: UserPasswordResetToken;
};
