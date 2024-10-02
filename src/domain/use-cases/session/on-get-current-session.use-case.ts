import { Either, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Session } from "@/domain/entities/session.entity";
import { SessionRepository } from "@/domain/gateways/repositories/session.repository";
import { Injectable } from "@nestjs/common";

type OnGetCurrentSessionUseCaseInput = {
  session: Session;
};

type OnGetCurrentSessionUseCaseOutput = Either<null, null>;

@Injectable()
export class OnGetCurrentSessionUseCase extends UseCase<
  OnGetCurrentSessionUseCaseInput,
  OnGetCurrentSessionUseCaseOutput
> {
  constructor(private readonly sessionRepository: SessionRepository) {
    super();
  }

  protected async handle({ session }: OnGetCurrentSessionUseCaseInput) {
    await this.sessionRepository.updateUniqueToRenew(session);

    return right(null);
  }
}
