import { User, UserEntity } from "@/domain/entities/user.entity";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService, DrizzleSession } from "../drizzle.service";
import { DrizzleUserData } from "../schemas/user.schema";

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async createUnique(
    user: User,
    { session }: { session: DrizzleSession } = { session: this.drizzle.client },
  ): Promise<void> {
    const query = sql`
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
          ${user.id.value},
          ${user.email.value},
          ${user.password.value},
          ${user.name.value},
          ${user.activatedAt},
          ${user.updatedAt},
          ${user.createdAt}
        );
    `;

    await session.execute(query);
  }

  async findUniqueByEmail(email: string): Promise<User | null> {
    const query = sql`
      SELECT
        *
      FROM
        users
      WHERE
        email = ${email}
    `;
    const [user] = await this.drizzle.executeToGet<DrizzleUserData>(query);

    if (!user) return null;

    return UserEntity.create(user);
  }
}
