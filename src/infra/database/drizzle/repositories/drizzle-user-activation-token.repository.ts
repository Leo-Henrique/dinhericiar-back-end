import {
  UserActivationToken,
  UserActivationTokenEntity,
} from "@/domain/entities/user-activation-token.entity";
import { User, UserEntity } from "@/domain/entities/user.entity";
import {
  UserActivationTokenRepository,
  UserActivationTokenWithUser,
} from "@/domain/gateways/repositories/user-activation-token.repository";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService, DrizzleSession } from "../drizzle.service";
import { DrizzleUserActivationTokenData } from "../schemas/user-activation-token.schema";
import { DrizzleUserData } from "../schemas/user.schema";

@Injectable()
export class DrizzleUserActivationTokenRepository
  implements UserActivationTokenRepository
{
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userRepository: UserRepository,
  ) {}

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

  async findUniqueByTokenWithUser(
    token: string,
  ): Promise<UserActivationTokenWithUser | null> {
    type Row = DrizzleUserActivationTokenData & DrizzleUserData;

    const query = sql`
      SELECT
        *
      FROM
        user_activation_tokens
      INNER JOIN
        users ON users.id = user_activation_tokens.user_id
      WHERE
        token = ${token}
    `;
    const [userActivationTokenWithUserOnDatabase] =
      await this.drizzle.executeToGet<Row>(query);

    if (!userActivationTokenWithUserOnDatabase) return null;

    const {
      userId,
      token: tokenOnDatabase,
      expiresAt,
      ...userOnDatabase
    } = userActivationTokenWithUserOnDatabase;

    return {
      user: UserEntity.create(userOnDatabase),
      userActivationToken: UserActivationTokenEntity.create({
        userId,
        token: tokenOnDatabase,
        expiresAt,
      }),
    };
  }

  async activateUserAccount(
    user: User,
    userActivationToken: UserActivationToken,
  ): Promise<void> {
    const clearUserTokensQuery = sql`
      DELETE FROM
        user_activation_tokens
      WHERE
        user_id = ${userActivationToken.userId.value};
    `;

    await this.drizzle.client.transaction(async session => {
      await Promise.all([
        this.userRepository.updateUnique(
          user,
          { activatedAt: new Date() },
          { session },
        ),
        session.execute(clearUserTokensQuery),
      ]);
    });
  }
}
