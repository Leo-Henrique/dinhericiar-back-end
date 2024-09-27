import { Factory } from "@/core/factory";
import { UserDataCreateInput, UserEntity } from "@/domain/entities/user.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

type UserFactoryInput = Partial<UserDataCreateInput>;

export type UserFactoryMakeOutput = Awaited<ReturnType<UserFactory["make"]>>;

export type UserFactoryMakeAndSaveOutput = Awaited<
  ReturnType<UserFactory["makeAndSave"]>
>;

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

  async makeAndSave(override: UserFactoryInput = {}) {
    const user = this.make(override);

    await this.drizzle?.client.execute(sql`
      INSERT INTO users
        (
          id,
          email,
          password,
          name,
          activated_at,
          updated_at,
          created_at
        )
      VALUES
        (
          ${user.entity.id.value},
          ${user.entity.email.value},
          ${user.entity.password.value},
          ${user.entity.name.value},
          ${user.entity.activatedAt},
          ${user.entity.updatedAt},
          ${user.entity.createdAt}
        )
    `);

    return user;
  }
}
