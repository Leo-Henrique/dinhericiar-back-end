import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { SessionSchemaToGet } from "@/domain/entities/schemas/session.schema";
import { Session } from "@/domain/entities/session.entity";
import { User } from "@/domain/entities/user.entity";
import { SessionExpiredError, SessionIsBadError } from "@/domain/errors";
import { SessionRepository } from "@/domain/gateways/repositories/session.repository";
import { Injectable } from "@nestjs/common";

type CheckSessionIntegrityUseCaseInput = SessionSchemaToGet;

type CheckSessionIntegrityUseCaseOutput = Either<
  SessionIsBadError | SessionExpiredError,
  {
    user: User;
    session: Session;
  }
>;

@Injectable()
export class CheckSessionIntegrityUseCase extends UseCase<
  CheckSessionIntegrityUseCaseInput,
  CheckSessionIntegrityUseCaseOutput
> {
  constructor(private readonly sessionRepository: SessionRepository) {
    super();
  }

  protected async handle({ token }: CheckSessionIntegrityUseCaseInput) {
    const sessionWithUser =
      await this.sessionRepository.findUniqueByTokenWithUser(token);

    if (!sessionWithUser)
      return left(
        new SessionIsBadError(
          "A sessão ou o usuário autor da sessão não existe.",
        ),
      );

    const { user, session } = sessionWithUser;

    if (new Date() >= session.expiresAt) return left(new SessionExpiredError());

    return right({ user, session });
  }
}
