import { Either, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Session } from "@/domain/entities/session.entity";
import { SessionRepository } from "@/domain/gateways/repositories/session.repository";
import { Injectable } from "@nestjs/common";

type RevokeSessionUseCaseInput = {
  session: Session;
};

type RevokeSessionUseCaseOutput = Either<null, null>;

@Injectable()
export class RevokeSessionUseCase extends UseCase<
  RevokeSessionUseCaseInput,
  RevokeSessionUseCaseOutput
> {
  constructor(private readonly sessionRepository: SessionRepository) {
    super();
  }

  protected async handle({ session }: RevokeSessionUseCaseInput) {
    await this.sessionRepository.updateUniqueToRevoke(session);

    return right(null);
  }
}
