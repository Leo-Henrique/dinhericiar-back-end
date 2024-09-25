import { UserActivationToken } from "@/domain/entities/user-activation-token.entity";
import { UnitOfWorkSessionOptions } from "../unit-of-work";

export abstract class UserActivationTokenRepository {
  abstract createUnique(
    userActivationToken: UserActivationToken,
    options?: UnitOfWorkSessionOptions,
  ): Promise<void>;
}
