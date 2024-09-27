import { Session } from "@/domain/entities/session.entity";

export abstract class SessionRepository {
  abstract createUnique(session: Session): Promise<void>;
}
