import { Factory } from "@/core/factory";
import {
  UserDataDomainCreateInput,
  UserEntity,
} from "@/domain/entities/user.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

type UserFactoryInput = Partial<UserDataDomainCreateInput>;

@Injectable()
export class UserFactory extends Factory<UserFactoryInput> {
  constructor(private readonly drizzle: DrizzleService | null = null) {
    super();
  }

  make(override: UserFactoryInput = {}) {
    const input = {
      email: faker.internet.email(),
      password: faker.internet.password(),
      name: faker.person.fullName(),
      activatedAt: faker.date.recent(),
      ...override,
    } satisfies UserDataDomainCreateInput;
    const entity = UserEntity.create(input);

    return { input, entity };
  }

  async makeAndSave(override: UserFactoryInput = {}) {
    const user = this.make(override);

    await this.drizzle?.executeToGet(sql`
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
        );
    `);

    return user;
  }
}
