import { ArrayWithExactLength } from "@/core/@types/array-with-exact-length";
import { Factory } from "@/core/factory";
import { UserDataCreateInput, UserEntity } from "@/domain/entities/user.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { drizzleUserTable } from "@/infra/database/drizzle/schemas/drizzle-user.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

type UserFactoryInput = Partial<UserDataCreateInput>;

export type UserFactoryOutput = ReturnType<UserFactory["make"]>;

@Injectable()
export class UserFactory extends Factory<UserFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: UserFactoryInput = {}) {
    const input = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      name: faker.person.fullName(),
      ...override,
    } satisfies UserDataCreateInput;
    const entity = UserEntity.create(input);

    return { input, entity };
  }

  async makeAndSaveUnique(override: UserFactoryInput = {}) {
    const user = this.make(override);

    await this.drizzle?.client
      .insert(drizzleUserTable)
      .values(user.entity.getRawData());

    return user;
  }

  async makeAndSaveMany(overrides: UserFactoryInput[] = [{}]) {
    const users = overrides?.map(this.make);

    await this.drizzle?.client
      ?.insert(drizzleUserTable)
      .values(users.map(user => user.entity.getRawData()));

    return users;
  }

  async makeAndSaveManyByAmount<Amount extends number>(
    amount: Amount = 1 as Amount,
    override: UserFactoryInput = {},
  ) {
    return this.makeAndSaveMany(
      Array.from({ length: amount }).map(() => override),
    ) as ArrayWithExactLength<Amount, UserFactoryOutput>;
  }
}
