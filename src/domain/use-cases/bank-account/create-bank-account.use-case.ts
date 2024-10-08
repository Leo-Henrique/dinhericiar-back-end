import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import {
  BankAccount,
  BankAccountEntity,
} from "@/domain/entities/bank-account.entity";
import { BankAccountSchemaToCreate } from "@/domain/entities/schemas/bank-account.schema";
import { User } from "@/domain/entities/user.entity";
import { ResourceAlreadyExistsError } from "@/domain/errors";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { Injectable } from "@nestjs/common";

type CreateBankAccountUseCaseInput = BankAccountSchemaToCreate & {
  authenticatedUser: User;
};

type CreateBankAccountUseCaseOutput = Either<
  ResourceAlreadyExistsError,
  {
    bankAccount: BankAccount;
  }
>;

@Injectable()
export class CreateBankAccountUseCase extends UseCase<
  CreateBankAccountUseCaseInput,
  CreateBankAccountUseCaseOutput
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {
    super();
  }

  protected async handle({
    authenticatedUser,
    institution,
    name,
    isMainAccount,
    ...restInput
  }: CreateBankAccountUseCaseInput) {
    const userBankAccountWithSameInstitution =
      await this.bankAccountRepository.findUniqueByInstitutionFromUser(
        institution,
        authenticatedUser,
      );

    if (userBankAccountWithSameInstitution)
      return left(
        new ResourceAlreadyExistsError(
          `Uma conta bancária da instituição "${userBankAccountWithSameInstitution.institution.value}" já existe.`,
        ),
      );

    const userBankAccountWithSameName =
      await this.bankAccountRepository.findUniqueByNameFromUser(
        name,
        authenticatedUser,
      );

    if (userBankAccountWithSameName)
      return left(
        new ResourceAlreadyExistsError(
          `Uma conta bancária com o nome "${userBankAccountWithSameName.name.value}" já existe.`,
        ),
      );

    if (isMainAccount) {
      const userMainBankAccount =
        await this.bankAccountRepository.findUniqueMainFromUser(
          authenticatedUser,
        );

      if (userMainBankAccount) {
        return left(
          new ResourceAlreadyExistsError(
            `Você já tem uma conta bancária marcada como principal. Edite a conta com o nome "${userMainBankAccount.name.value}" para poder criar outra conta dessa forma.`,
          ),
        );
      }
    }

    const bankAccount = BankAccountEntity.create({
      userId: authenticatedUser.id.value,
      institution,
      name,
      ...restInput,
    });

    await this.bankAccountRepository.createUnique(bankAccount);

    return right({ bankAccount });
  }
}
