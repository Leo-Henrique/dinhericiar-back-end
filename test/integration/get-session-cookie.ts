import { Session } from "@/domain/entities/session.entity";
import { SESSION_COOKIE_NAME } from "@/infra/http/auth/session-cookie-name";

export function getSessionCookie(session: Session) {
  return [`${SESSION_COOKIE_NAME}=${session.token.value}`];
}
