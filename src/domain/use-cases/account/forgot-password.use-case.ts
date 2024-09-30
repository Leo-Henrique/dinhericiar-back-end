import { InferLeftReason } from "@/core/@types/either";
import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { UserPasswordResetTokenSchemaToCreate } from "@/domain/entities/schemas/user-password-reset-token.schema";
import {
  UserPasswordResetToken,
  UserPasswordResetTokenEntity,
} from "@/domain/entities/user-password-reset-token.entity";
import { ResourceNotFoundError } from "@/domain/errors";
import { Encryption } from "@/domain/gateways/cryptology/encryption";
import {
  EmailDispatcher,
  SendEmailOutput,
} from "@/domain/gateways/email-dispatcher";
import { UserPasswordResetTokenRepository } from "@/domain/gateways/repositories/user-password-reset-token.repository";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";
import { Injectable } from "@nestjs/common";

type ForgotPasswordUseCaseInput = UserPasswordResetTokenSchemaToCreate;

type ForgotPasswordUseCaseOutput = Either<
  ResourceNotFoundError | InferLeftReason<SendEmailOutput>,
  {
    userPasswordResetToken: UserPasswordResetToken;
  }
>;

@Injectable()
export class ForgotPasswordUseCase extends UseCase<
  ForgotPasswordUseCaseInput,
  ForgotPasswordUseCaseOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly encryption: Encryption,
    private readonly emailDispatcher: EmailDispatcher,
    private readonly userPasswordResetTokenRepository: UserPasswordResetTokenRepository,
  ) {
    super();
  }

  protected async handle({ email }: ForgotPasswordUseCaseInput) {
    const user = await this.userRepository.findUniqueByEmail(email);

    if (!user)
      return left(
        new ResourceNotFoundError("O e-mail informado não está cadastrado."),
      );

    const passwordResetToken = await this.encryption.encrypt(
      UserPasswordResetTokenEntity.tokenBytes,
    );
    const userPasswordResetToken = UserPasswordResetTokenEntity.create({
      userId: user.id.value,
      token: passwordResetToken,
    });

    const sendEmailToActivationAccount =
      await this.emailDispatcher.sendToResetPassword(
        user,
        userPasswordResetToken,
      );

    if (sendEmailToActivationAccount.isLeft())
      return left(sendEmailToActivationAccount.reason);

    await this.userPasswordResetTokenRepository.createUnique(
      userPasswordResetToken,
    );

    return right({ userPasswordResetToken });
  }
}
