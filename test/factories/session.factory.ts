import { Factory } from "@/core/factory";
import {
  SessionDataCreateInput,
  SessionEntity,
} from "@/domain/entities/session.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { drizzleSessionTable } from "@/infra/database/drizzle/schemas/drizzle-session.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

type SessionFactoryInput = Partial<SessionDataCreateInput>;

export type SessionFactoryOutput = ReturnType<SessionFactory["make"]>;

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

  async makeAndSaveUnique(override: SessionFactoryInput = {}) {
    const session = this.make(override);

    await this.drizzle?.client
      .insert(drizzleSessionTable)
      .values(session.entity.getRawData());

    return session;
  }

  async makeAndSaveMany(
    overrides: [SessionFactoryInput, ...SessionFactoryInput[]] = [{}],
  ) {
    const sessions = overrides?.map(this.make);

    await this.drizzle?.client
      ?.insert(drizzleSessionTable)
      .values(sessions.map(session => session.entity.getRawData()));

    return sessions;
  }
}
