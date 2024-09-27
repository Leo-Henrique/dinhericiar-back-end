import { UserActivationToken } from "@/domain/entities/user-activation-token.entity";
import { User } from "@/domain/entities/user.entity";
import { UnitOfWorkSessionOptions } from "../unit-of-work";

export abstract class UserActivationTokenRepository {
  abstract createUnique(
    userActivationToken: UserActivationToken,
    options?: UnitOfWorkSessionOptions,
  ): Promise<void>;
  abstract findUniqueByTokenWithUser(
    token: string,
  ): Promise<UserActivationTokenWithUser | null>;
  abstract activateUserAccount(
    user: User,
    userActivationToken: UserActivationToken,
  ): Promise<void>;
}

export type UserActivationTokenWithUser = {
  user: User;
  userActivationToken: UserActivationToken;
};
