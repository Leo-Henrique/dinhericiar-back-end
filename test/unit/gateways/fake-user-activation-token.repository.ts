import { UserActivationToken } from "@/domain/entities/user-activation-token.entity";
import { UserActivationTokenRepository } from "@/domain/gateways/repositories/user-activation-token.repository";

export class FakeUserActivationTokenRepository
  implements UserActivationTokenRepository
{
  async createUnique(): Promise<void> {}

  async findUniqueByToken(): Promise<UserActivationToken | null> {
    return null;
  }

  async activateUserAccount(): Promise<void> {}
}
