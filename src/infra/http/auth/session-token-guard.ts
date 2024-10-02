import { SessionEntity } from "@/domain/entities/session.entity";
import { SessionIsBadError } from "@/domain/errors";
import { CheckSessionIntegrityUseCase } from "@/domain/use-cases/session/check-session-integrity.use-case";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { FastifyRequestWithUser } from "./authenticated-user-decorator";
import { SESSION_COOKIE_NAME } from "./session-cookie-name";

@Injectable()
export class SessionTokenGuard implements CanActivate {
  constructor(
    private readonly checkSessionIntegrityUseCase: CheckSessionIntegrityUseCase,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequestWithUser>();
    const token = request.cookies[SESSION_COOKIE_NAME];

    const parsedToken = SessionEntity.schema.toGet.safeParse({ token });

    if (!parsedToken.success) throw new SessionIsBadError(parsedToken.error);

    const { user, session } =
      await this.checkSessionIntegrityUseCase.unsafeExecute({
        token: parsedToken.data.token,
      });

    request.currentSession = { user, session };

    return true;
  }
}
