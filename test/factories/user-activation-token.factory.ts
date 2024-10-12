import { Factory } from "@/core/factory";
import {
  UserActivationTokenDataCreateInput,
  UserActivationTokenEntity,
} from "@/domain/entities/user-activation-token.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { drizzleUserActivationTokenTable } from "@/infra/database/drizzle/schemas/drizzle-user-activation-token.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

type UserActivationTokenFactoryInput =
  Partial<UserActivationTokenDataCreateInput>;

export type UserActivationTokenFactoryOutput = ReturnType<
  UserActivationTokenFactory["make"]
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

  async makeAndSaveUnique(override: UserActivationTokenFactoryInput = {}) {
    const userActivationToken = this.make(override);

    await this.drizzle?.client
      .insert(drizzleUserActivationTokenTable)
      .values(userActivationToken.entity.getRawData());

    return userActivationToken;
  }

  async makeAndSaveMany(
    overrides: [
      UserActivationTokenFactoryInput,
      ...UserActivationTokenFactoryInput[],
    ] = [{}],
  ) {
    const userActivationTokens = overrides?.map(this.make);

    await this.drizzle?.client
      ?.insert(drizzleUserActivationTokenTable)
      .values(
        userActivationTokens.map(userActivationToken =>
          userActivationToken.entity.getRawData(),
        ),
      );

    return userActivationTokens;
  }
}
