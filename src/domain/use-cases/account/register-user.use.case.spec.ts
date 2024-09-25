import { UserActivationTokenEntity } from "@/domain/entities/user-activation-token.entity";
import { UserEntity } from "@/domain/entities/user.entity";
import { UserFactory } from "test/factories/user.factory";
import { FakeEmailDispatcher } from "test/unit/gateways/fake-email-dispatcher";
import { FakeEncryption } from "test/unit/gateways/fake-encryption";
import { FakePasswordHasher } from "test/unit/gateways/fake-password-hasher";
import { FakeUnitOfWork } from "test/unit/gateways/fake-unit-of-work";
import { FakeUserActivationTokenRepository } from "test/unit/gateways/fake-user-activation-token.repository";
import { FakeUserRepository } from "test/unit/gateways/fake-user.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterUserUseCase } from "./register-user.use-case";

describe("[Use Case] Register user", () => {
  let userRepository: FakeUserRepository;
  let passwordHasher: FakePasswordHasher;
  let encryption: FakeEncryption;
  let emailDispatcher: FakeEmailDispatcher;
  let unitOfWork: FakeUnitOfWork;
  let userActivationTokenRepository: FakeUserActivationTokenRepository;

  let sut: RegisterUserUseCase;

  let userFactory: UserFactory;

  beforeEach(() => {
    userRepository = new FakeUserRepository();
    passwordHasher = new FakePasswordHasher();
    encryption = new FakeEncryption();
    emailDispatcher = new FakeEmailDispatcher();
    unitOfWork = new FakeUnitOfWork();
    userActivationTokenRepository = new FakeUserActivationTokenRepository();

    sut = new RegisterUserUseCase(
      userRepository,
      passwordHasher,
      encryption,
      emailDispatcher,
      unitOfWork,
      userActivationTokenRepository,
    );

    userFactory = new UserFactory();
  });

  it("should be able to register a user", async () => {
    const user = userFactory.make();

    const userRepositoryFindUniqueByEmailSpy = vi.spyOn(
      userRepository,
      "findUniqueByEmail",
    );
    const passwordHasherHashSpy = vi.spyOn(passwordHasher, "hash");
    const encryptionEncryptSpy = vi.spyOn(encryption, "encrypt");
    const userEntityCreateSpy = vi.spyOn(UserEntity, "create");
    const userActivationTokenEntityCreateSpy = vi.spyOn(
      UserActivationTokenEntity,
      "create",
    );
    const emailDispatcherSendToActivationAccountSpy = vi.spyOn(
      emailDispatcher,
      "sendToActivationAccount",
    );
    const unitOfWorkTransactionSpy = vi.spyOn(unitOfWork, "transaction");
    const userRepositoryCreateUniqueSpy = vi.spyOn(
      userRepository,
      "createUnique",
    );
    const userActivationTokenRepositoryCreateUniqueSpy = vi.spyOn(
      userActivationTokenRepository,
      "createUnique",
    );

    const { isRight } = await sut.execute<"success">(user.input);

    expect(isRight()).toBeTruthy();
    expect(userRepositoryFindUniqueByEmailSpy.mock.invocationCallOrder).toEqual(
      [1],
    );
    expect(passwordHasherHashSpy.mock.invocationCallOrder[0]).toBeLessThan(
      userEntityCreateSpy.mock.invocationCallOrder[0],
    );
    expect(encryptionEncryptSpy.mock.invocationCallOrder[0]).toBeLessThan(
      userActivationTokenEntityCreateSpy.mock.invocationCallOrder[0],
    );
    expect(unitOfWorkTransactionSpy).toHaveBeenCalledTimes(1);
    expect(
      emailDispatcherSendToActivationAccountSpy.mock.invocationCallOrder[0],
    ).toBeLessThan(userRepositoryCreateUniqueSpy.mock.invocationCallOrder[0]);
    expect(
      emailDispatcherSendToActivationAccountSpy.mock.invocationCallOrder[0],
    ).toBeLessThan(
      userActivationTokenRepositoryCreateUniqueSpy.mock.invocationCallOrder[0],
    );
  });
});
