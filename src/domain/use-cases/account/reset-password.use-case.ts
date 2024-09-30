import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { UserPasswordResetTokenSchemaToReset } from "@/domain/entities/schemas/user-password-reset-token.schema";
import {
  BadRequestError,
  UserPasswordResetTokenExpiredError,
} from "@/domain/errors";
import { PasswordHasher } from "@/domain/gateways/cryptology/password-hasher";
import { UserPasswordResetTokenRepository } from "@/domain/gateways/repositories/user-password-reset-token.repository";
import { Injectable } from "@nestjs/common";

type ResetPasswordUseCaseInput = UserPasswordResetTokenSchemaToReset;

type ResetPasswordUseCaseOutput = Either<
  BadRequestError | UserPasswordResetTokenExpiredError,
  null
>;

@Injectable()
export class ResetPasswordUseCase extends UseCase<
  ResetPasswordUseCaseInput,
  ResetPasswordUseCaseOutput
> {
  constructor(
    private readonly userPasswordResetTokenRepository: UserPasswordResetTokenRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {
    super();
  }

  protected async handle({ token, password }: ResetPasswordUseCaseInput) {
    const userPasswordResetTokenWithUser =
      await this.userPasswordResetTokenRepository.findUniqueByTokenWithUser(
        token,
      );

    if (!userPasswordResetTokenWithUser)
      return left(
        new BadRequestError(
          "Token inválido.",
          "O token de redefinição de senha ou o usuário autor do token não existe.",
        ),
      );

    const { user, userPasswordResetToken } = userPasswordResetTokenWithUser;

    if (new Date() >= userPasswordResetToken.expiresAt)
      return left(new UserPasswordResetTokenExpiredError());

    const passwordHashed = await this.passwordHasher.hash(password);

    await this.userPasswordResetTokenRepository.resetUserPassword(
      user,
      userPasswordResetToken,
      passwordHashed,
    );

    return right(null);
  }
}
