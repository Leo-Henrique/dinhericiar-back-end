import { InferLeftReason } from "@/core/@types/either";
import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { SessionSchemaToCreate } from "@/domain/entities/schemas/session.schema";
import { Session, SessionEntity } from "@/domain/entities/session.entity";
import { UserActivationTokenEntity } from "@/domain/entities/user-activation-token.entity";
import { User } from "@/domain/entities/user.entity";
import {
  InvalidCredentialsError,
  ResourceAlreadyExistsError,
  UserAccountNotActivatedError,
} from "@/domain/errors";
import { Encryption } from "@/domain/gateways/cryptology/encryption";
import { PasswordHasher } from "@/domain/gateways/cryptology/password-hasher";
import {
  EmailDispatcher,
  SendEmailOutput,
} from "@/domain/gateways/email-dispatcher";
import { SessionRepository } from "@/domain/gateways/repositories/session.repository";
import { UserActivationTokenRepository } from "@/domain/gateways/repositories/user-activation-token.repository";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";
import { Injectable } from "@nestjs/common";

type AuthenticateUseCaseInput = SessionSchemaToCreate;

type AuthenticateUseCaseOutput = Either<
  | InvalidCredentialsError
  | ResourceAlreadyExistsError
  | InferLeftReason<SendEmailOutput>
  | UserAccountNotActivatedError,
  {
    user: User;
    session: Session;
  }
>;

@Injectable()
export class AuthenticateUseCase extends UseCase<
  AuthenticateUseCaseInput,
  AuthenticateUseCaseOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly encryption: Encryption,
    private readonly emailDispatcher: EmailDispatcher,
    private readonly userActivationTokenRepository: UserActivationTokenRepository,
    private readonly sessionRepository: SessionRepository,
  ) {
    super();
  }

  protected async handle({ email, password }: AuthenticateUseCaseInput) {
    const user = await this.userRepository.findUniqueByEmail(email);

    if (!user) return left(new InvalidCredentialsError());

    const isValidPassword = await this.passwordHasher.match(
      password,
      user.password.value,
    );

    if (!isValidPassword) return left(new InvalidCredentialsError());

    if (!user.activatedAt) {
      const activationToken = await this.encryption.encrypt(
        UserActivationTokenEntity.tokenBytes,
      );
      const userActivationToken = UserActivationTokenEntity.create({
        userId: user.id.value,
        token: activationToken,
      });

      const sendEmailToActivationAccount =
        await this.emailDispatcher.sendToActivationAccount(
          user,
          userActivationToken,
        );

      if (sendEmailToActivationAccount.isLeft())
        return left(sendEmailToActivationAccount.reason);

      await this.userActivationTokenRepository.createUnique(
        userActivationToken,
      );

      return left(new UserAccountNotActivatedError());
    }

    const token = await this.encryption.encrypt(SessionEntity.tokenBytes);
    const session = SessionEntity.create({ userId: user.id.value, token });

    await this.sessionRepository.createUnique(session);

    return right({ user, session });
  }
}
