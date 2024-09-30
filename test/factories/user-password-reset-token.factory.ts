import { Factory } from "@/core/factory";
import {
  UserPasswordResetTokenDataCreateInput,
  UserPasswordResetTokenEntity,
} from "@/domain/entities/user-password-reset-token.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

type UserPasswordResetTokenFactoryInput =
  Partial<UserPasswordResetTokenDataCreateInput>;

export type UserPasswordResetTokenFactoryMakeOutput = Awaited<
  ReturnType<UserPasswordResetTokenFactory["make"]>
>;

export type UserPasswordResetTokenFactoryMakeAndSaveOutput = Awaited<
  ReturnType<UserPasswordResetTokenFactory["makeAndSave"]>
>;

@Injectable()
export class UserPasswordResetTokenFactory extends Factory<UserPasswordResetTokenFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: UserPasswordResetTokenFactoryInput = {}) {
    const input = {
      userId: faker.string.uuid(),
      token: faker.string.hexadecimal({
        length: UserPasswordResetTokenEntity.tokenBytes * 2,
        prefix: "",
      }),
      ...override,
    } satisfies UserPasswordResetTokenDataCreateInput;
    const entity = UserPasswordResetTokenEntity.create(input);

    return { input, entity };
  }

  async makeAndSave(override: UserPasswordResetTokenFactoryInput = {}) {
    const userPasswordResetToken = this.make(override);

    await this.drizzle?.client.execute(sql`
      INSERT INTO user_password_reset_tokens 
        (
          user_id,
          token,
          expires_at
        )
      VALUES
        (
          ${userPasswordResetToken.entity.userId.value},
          ${userPasswordResetToken.entity.token.value},
          ${userPasswordResetToken.entity.expiresAt}
        )
    `);

    return userPasswordResetToken;
  }
}
