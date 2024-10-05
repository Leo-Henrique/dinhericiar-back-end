import {
  UserPasswordResetToken,
  UserPasswordResetTokenEntity,
} from "@/domain/entities/user-password-reset-token.entity";
import { User, UserEntity } from "@/domain/entities/user.entity";
import {
  UserPasswordResetTokenRepository,
  UserPasswordResetTokenWithUser,
} from "@/domain/gateways/repositories/user-password-reset-token.repository";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import { DrizzleUserData } from "../schemas/drizzle-user.schema";
import { DrizzleUserPasswordResetTokenData } from "../schemas/drizzle-user-password-reset-token.schema";

@Injectable()
export class DrizzleUserPasswordResetTokenRepository
  implements UserPasswordResetTokenRepository
{
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly userRepository: UserRepository,
  ) {}

  async createUnique(
    userPasswordResetToken: UserPasswordResetToken,
  ): Promise<void> {
    const query = sql`
      INSERT INTO user_password_reset_tokens
        (
          user_id,
          token,
          expires_at
        )
      VALUES
        (
          ${userPasswordResetToken.userId.value},
          ${userPasswordResetToken.token.value},
          ${userPasswordResetToken.expiresAt}
        )
    `;

    await this.drizzle.client.execute(query);
  }

  async findUniqueByTokenWithUser(
    token: string,
  ): Promise<UserPasswordResetTokenWithUser | null> {
    type Row = DrizzleUserPasswordResetTokenData & DrizzleUserData;

    const query = sql`
      SELECT
        *
      FROM
        user_password_reset_tokens
      INNER JOIN
        users ON users.id = user_password_reset_tokens.user_id
      WHERE
        token = ${token}
    `;
    const [userPasswordResetTokenWithUserOnDatabase] =
      await this.drizzle.executeToGet<Row>(query);

    if (!userPasswordResetTokenWithUserOnDatabase) return null;

    const {
      userId,
      token: tokenOnDatabase,
      expiresAt,
      ...userOnDatabase
    } = userPasswordResetTokenWithUserOnDatabase;

    return {
      user: UserEntity.create(userOnDatabase),
      userPasswordResetToken: UserPasswordResetTokenEntity.create({
        userId,
        token: tokenOnDatabase,
        expiresAt,
      }),
    };
  }

  async resetUserPassword(
    user: User,
    userPasswordResetToken: UserPasswordResetToken,
    passwordHashed: string,
  ): Promise<void> {
    const clearUserPasswordResetTokensQuery = sql`
      DELETE FROM
        user_password_reset_tokens
      WHERE
        user_id = ${userPasswordResetToken.userId.value};
    `;

    await this.drizzle.client.transaction(async session => {
      await Promise.all([
        this.userRepository.updateUnique(
          user,
          { password: passwordHashed },
          { session },
        ),
        session.execute(clearUserPasswordResetTokensQuery),
      ]);
    });
  }
}
