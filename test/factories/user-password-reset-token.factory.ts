import { Factory } from "@/core/factory";
import {
  UserPasswordResetTokenDataCreateInput,
  UserPasswordResetTokenEntity,
} from "@/domain/entities/user-password-reset-token.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { drizzleUserPasswordResetTokenTable } from "@/infra/database/drizzle/schemas/drizzle-user-password-reset-token.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

type UserPasswordResetTokenFactoryInput =
  Partial<UserPasswordResetTokenDataCreateInput>;

export type UserPasswordResetTokenFactoryOutput = ReturnType<
  UserPasswordResetTokenFactory["make"]
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

  async makeAndSaveUnique(override: UserPasswordResetTokenFactoryInput = {}) {
    const userPasswordResetToken = this.make(override);

    await this.drizzle?.client
      .insert(drizzleUserPasswordResetTokenTable)
      .values(userPasswordResetToken.entity.getRawData());

    return userPasswordResetToken;
  }

  async makeAndSaveMany(
    overrides: [
      UserPasswordResetTokenFactoryInput,
      ...UserPasswordResetTokenFactoryInput[],
    ] = [{}],
  ) {
    const userPasswordResetTokens = overrides?.map(this.make);

    await this.drizzle?.client
      ?.insert(drizzleUserPasswordResetTokenTable)
      .values(
        userPasswordResetTokens.map(userPasswordResetToken =>
          userPasswordResetToken.entity.getRawData(),
        ),
      );

    return userPasswordResetTokens;
  }
}
