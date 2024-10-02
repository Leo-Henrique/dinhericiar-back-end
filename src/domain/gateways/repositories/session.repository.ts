import { Session } from "@/domain/entities/session.entity";
import { User } from "@/domain/entities/user.entity";

export abstract class SessionRepository {
  abstract createUnique(session: Session): Promise<void>;
  abstract findUniqueByTokenWithUser(
    token: string,
  ): Promise<SessionWithUser | null>;
  abstract updateUniqueToRenew(session: Session): Promise<void>;
  abstract updateUniqueToRevoke(session: Session): Promise<void>;
}

export type SessionWithUser = {
  user: User;
  session: Session;
};
