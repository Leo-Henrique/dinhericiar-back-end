import { Factory } from "@/core/factory";
import {
  UserActivationTokenDataCreateInput,
  UserActivationTokenEntity,
} from "@/domain/entities/user-activation-token.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

type UserActivationTokenFactoryInput =
  Partial<UserActivationTokenDataCreateInput>;

export type UserActivationTokenFactoryMakeOutput = Awaited<
  ReturnType<UserActivationTokenFactory["make"]>
>;

export type UserActivationTokenFactoryMakeAndSaveOutput = Awaited<
  ReturnType<UserActivationTokenFactory["makeAndSave"]>
>;

@Injectable()
export class UserActivationTokenFactory extends Factory<UserActivationTokenFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: UserActivationTokenFactoryInput = {}) {
    const input = {
      userId: faker.string.uuid(),
      token: faker.string.hexadecimal({
        length: UserActivationTokenEntity.tokenBytes * 2,
        prefix: "",
      }),
      ...override,
    } satisfies UserActivationTokenDataCreateInput;
    const entity = UserActivationTokenEntity.create(input);

    return { input, entity };
  }

  async makeAndSave(override: UserActivationTokenFactoryInput = {}) {
    const userActivationToken = this.make(override);

    await this.drizzle?.client.execute(sql`
      INSERT INTO user_activation_tokens 
        (
          user_id,
          token,
          expires_at
        )
      VALUES
        (
          ${userActivationToken.entity.userId.value},
          ${userActivationToken.entity.token.value},
          ${userActivationToken.entity.expiresAt}
        )
    `);

    return userActivationToken;
  }
}
