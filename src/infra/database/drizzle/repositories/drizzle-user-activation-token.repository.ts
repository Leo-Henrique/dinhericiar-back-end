import { UserActivationToken } from "@/domain/entities/user-activation-token.entity";
import { UserActivationTokenRepository } from "@/domain/gateways/repositories/user-activation-token.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService, DrizzleSession } from "../drizzle.service";

@Injectable()
export class DrizzleUserActivationTokenRepository
  implements UserActivationTokenRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async createUnique(
    userActivationToken: UserActivationToken,
    { session }: { session: DrizzleSession } = { session: this.drizzle.client },
  ): Promise<void> {
    const query = sql`
      INSERT INTO user_activation_tokens 
        (
          user_id,
          token,
          expires_at
        )
      VALUES
        (
          ${userActivationToken.userId.value},
          ${userActivationToken.token.value},
          ${userActivationToken.expiresAt}
        )
    `;

    await session.execute(query);
  }
}
