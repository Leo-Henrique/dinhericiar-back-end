import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Token } from "@/domain/entities/value-objects/token";
import {
  BadRequestError,
  UserAccountAlreadyActivatedError,
  UserActivationTokenExpiredError,
} from "@/domain/errors";
import { UserActivationTokenRepository } from "@/domain/gateways/repositories/user-activation-token.repository";
import { Injectable } from "@nestjs/common";

type ActivateUserAccountUseCaseInput = {
  token: Token["value"];
};

type ActivateUserAccountUseCaseOutput = Either<
  | BadRequestError
  | UserAccountAlreadyActivatedError
  | UserActivationTokenExpiredError,
  null
>;

@Injectable()
export class ActivateUserAccountUseCase extends UseCase<
  ActivateUserAccountUseCaseInput,
  ActivateUserAccountUseCaseOutput
> {
  constructor(
    private readonly userActivationTokenRepository: UserActivationTokenRepository,
  ) {
    super();
  }

  protected async handle({ token }: ActivateUserAccountUseCaseInput) {
    const userActivationTokenWithUser =
      await this.userActivationTokenRepository.findUniqueByTokenWithUser(token);

    if (!userActivationTokenWithUser)
      return left(
        new BadRequestError(
          "Token inválido.",
          "O token de ativação de conta ou o usuário autor do token não existe.",
        ),
      );

    const { user, userActivationToken } = userActivationTokenWithUser;

    if (user.activatedAt) return left(new UserAccountAlreadyActivatedError());

    if (new Date() >= userActivationToken.expiresAt)
      return left(new UserActivationTokenExpiredError());

    await this.userActivationTokenRepository.activateUserAccount(
      user,
      userActivationToken,
    );

    return right(null);
  }
}
