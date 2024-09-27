import { Session } from "@/domain/entities/session.entity";
import { SessionRepository } from "@/domain/gateways/repositories/session.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";

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
}
