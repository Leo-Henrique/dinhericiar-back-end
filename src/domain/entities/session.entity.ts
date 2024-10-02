import {
  EntityDataCreateInput,
  EntityDataUpdateInput,
  EntityInstance,
} from "@/core/@types/entity";
import { Entity } from "@/core/entities/entity";
import { SetRequired } from "type-fest";
import { SessionEntitySchema } from "./schemas/session.schema";
import { Token } from "./value-objects/token";
import { UniqueEntityId } from "./value-objects/unique-entity.id";

export type Session = EntityInstance<SessionData, SessionEntity>;

export type SessionData = {
  userId: UniqueEntityId;
  token: Token;
  expiresAt: Date;
  updatedAt: Date | null;
  createdAt: Date;
};

export type SessionDataCreateInput = SetRequired<
  EntityDataCreateInput<SessionData>,
  "userId" | "token"
>;

export type SessionDataUpdateInput = Pick<
  EntityDataUpdateInput<SessionData>,
  "expiresAt"
>;

export class SessionEntity extends Entity<SessionData> {
  static readonly schema = SessionEntitySchema;

  static create(input: SessionDataCreateInput) {
    return new this().createEntity({
      updatedAt: null,
      createdAt: new Date(),
      expiresAt: new Date(
        Date.now() + SessionEntity.tokenDefaultDurationInMilliseconds,
      ),
      ...input,
      userId: new UniqueEntityId(input.userId),
      token: new Token(input.token),
    });
  }

  update<Input extends SessionDataUpdateInput>(input: Input) {
    return this.updateEntity(input);
  }

  public static get tokenBytes() {
    return 128 as const;
  }

  public static get tokenDefaultDurationInMilliseconds() {
    return 1000 * 60 * 60 * 24 * 3; // 3 days
  }
}
