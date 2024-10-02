import { Factory } from "@/core/factory";
import {
  SessionDataCreateInput,
  SessionEntity,
} from "@/domain/entities/session.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

type SessionFactoryInput = Partial<SessionDataCreateInput>;

export type SessionFactoryMakeOutput = Awaited<
  ReturnType<SessionFactory["make"]>
>;

export type SessionFactoryMakeAndSaveOutput = Awaited<
  ReturnType<SessionFactory["makeAndSave"]>
>;

@Injectable()
export class SessionFactory extends Factory<SessionFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: SessionFactoryInput = {}) {
    const input = {
      userId: faker.string.uuid(),
      token: faker.string.hexadecimal({
        length: SessionEntity.tokenBytes * 2,
        prefix: "",
      }),
      ...override,
    } satisfies SessionDataCreateInput;
    const entity = SessionEntity.create(input);

    return { input, entity };
  }

  async makeAndSave(override: SessionFactoryInput = {}) {
    const session = this.make(override);

    await this.drizzle?.client.execute(sql`
      INSERT INTO sessions 
        (
          user_id,
          token,
          expires_at,
          updated_at,
          created_at
        )
      VALUES
        (
          ${session.entity.userId.value},
          ${session.entity.token.value},
          ${session.entity.expiresAt},
          ${session.entity.updatedAt},
          ${session.entity.createdAt}
        )
    `);

    return session;
  }
}
