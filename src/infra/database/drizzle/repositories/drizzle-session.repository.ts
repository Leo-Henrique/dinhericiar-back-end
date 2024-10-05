import { Mapper } from "@/core/mapper";
import {
  Session,
  SessionDataUpdateInput,
  SessionEntity,
} from "@/domain/entities/session.entity";
import { UserEntity } from "@/domain/entities/user.entity";
import {
  SessionRepository,
  SessionWithUser,
} from "@/domain/gateways/repositories/session.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import { DrizzleUserData } from "../schemas/drizzle-user.schema";
import { DrizzleSessionData } from "../schemas/drizzle-session.schema";

@Injectable()
export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async createUnique(session: Session): Promise<void> {
    const query = sql`
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
          ${session.userId.value},
          ${session.token.value},
          ${session.expiresAt},
          ${session.updatedAt},
          ${session.createdAt}
        )
    `;

    await this.drizzle.client.execute(query);
  }

  private async updateUnique(
    session: Session,
    data: SessionDataUpdateInput,
  ): Promise<void> {
    const updatedSessionFields = session.update(data);
    const updatedSessionFieldNames = Object.keys(
      updatedSessionFields,
    ) as (keyof typeof updatedSessionFields)[];

    const query = sql`      
      UPDATE
        sessions
      SET
    `;

    for (let i = 0; i < updatedSessionFieldNames.length; i++) {
      const fieldName = updatedSessionFieldNames[i];
      const value = updatedSessionFields[fieldName];

      query.append(sql`
        ${sql.identifier(Mapper.toSnakeCase(fieldName))} = ${value}
      `);

      if (i < updatedSessionFieldNames.length - 1) query.append(sql`,`);
    }

    query.append(sql` WHERE token = ${session.token.value}`);

    await this.drizzle.client.execute(query);
  }

  async findUniqueByTokenWithUser(
    token: string,
  ): Promise<SessionWithUser | null> {
    type Row = DrizzleSessionData & DrizzleUserData;

    const query = sql`
      SELECT
        *
      FROM
        sessions
      INNER JOIN
        users ON users.id = sessions.user_id
      WHERE
        token = ${token}
    `;
    const [sessionWithUserOnDatabase] =
      await this.drizzle.executeToGet<Row>(query);

    if (!sessionWithUserOnDatabase) return null;

    const {
      userId,
      token: tokenOnDatabase,
      expiresAt,
      ...userOnDatabase
    } = sessionWithUserOnDatabase;

    return {
      user: UserEntity.create(userOnDatabase),
      session: SessionEntity.create({
        userId,
        token: tokenOnDatabase,
        expiresAt,
      }),
    };
  }

  async updateUniqueToRenew(session: Session): Promise<void> {
    await this.updateUnique(session, {
      expiresAt: new Date(
        Date.now() + SessionEntity.tokenDefaultDurationInMilliseconds,
      ),
    });
  }

  async updateUniqueToRevoke(session: Session): Promise<void> {
    await this.updateUnique(session, {
      expiresAt: new Date(),
    });
  }
}
