import { InferLeftReason } from "@/core/@types/either";
import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { UserActivationTokenEntity } from "@/domain/entities/user-activation-token.entity";
import {
  User,
  UserDataCreateInput,
  UserEntity,
} from "@/domain/entities/user.entity";
import { ResourceAlreadyExistsError } from "@/domain/errors";
import { Encryption } from "@/domain/gateways/cryptology/encryption";
import { PasswordHasher } from "@/domain/gateways/cryptology/password-hasher";
import {
  EmailDispatcher,
  SendEmailOutput,
} from "@/domain/gateways/email-dispatcher";
import { UserActivationTokenRepository } from "@/domain/gateways/repositories/user-activation-token.repository";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";
import { UnitOfWork } from "@/domain/gateways/unit-of-work";
import { Injectable } from "@nestjs/common";

type RegisterUserUseCaseInput = UserDataCreateInput;

type RegisterUserUseCaseOutput = Either<
  ResourceAlreadyExistsError | InferLeftReason<SendEmailOutput>,
  {
    user: User;
  }
>;

@Injectable()
export class RegisterUserUseCase extends UseCase<
  RegisterUserUseCaseInput,
  RegisterUserUseCaseOutput
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly encryption: Encryption,
    private readonly emailDispatcher: EmailDispatcher,
    private readonly unitOfWork: UnitOfWork,
    private readonly userActivationTokenRepository: UserActivationTokenRepository,
  ) {
    super();
  }

  protected async handle({
    email,
    password,
    ...restInput
  }: RegisterUserUseCaseInput) {
    const userWithSameEmail =
      await this.userRepository.findUniqueByEmail(email);

    if (userWithSameEmail)
      return left(
        new ResourceAlreadyExistsError("Um usuário com esse e-mail já existe."),
      );

    const [passwordHashed, activationToken] = await Promise.all([
      this.passwordHasher.hash(password),
      this.encryption.encrypt(UserActivationTokenEntity.tokenBytes),
    ]);

    const user = UserEntity.create({
      ...restInput,
      email,
      password: passwordHashed,
    });
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

    await this.unitOfWork.transaction(async session => {
      await this.userRepository.createUnique(user, { session });
      await this.userActivationTokenRepository.createUnique(
        userActivationToken,
        { session },
      );
    });

    return right({ user });
  }
}
