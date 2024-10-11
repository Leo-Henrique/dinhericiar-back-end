import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { BankAccount } from "@/domain/entities/bank-account.entity";
import { BankAccountSchemaToUpdate } from "@/domain/entities/schemas/bank-account.schema";
import { User } from "@/domain/entities/user.entity";
import { UniqueEntityId } from "@/domain/entities/value-objects/unique-entity.id";
import {
  ResourceAlreadyExistsError,
  ResourceNotFoundError,
} from "@/domain/errors";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { Injectable } from "@nestjs/common";

type UpdateBankAccountUseCaseInput = BankAccountSchemaToUpdate & {
  authenticatedUser: User;
  bankAccountId: UniqueEntityId["value"];
};

type UpdateBankAccountUseCaseOutput = Either<
  ResourceNotFoundError | ResourceAlreadyExistsError,
  {
    bankAccount: BankAccount;
  }
>;

@Injectable()
export class UpdateBankAccountUseCase extends UseCase<
  UpdateBankAccountUseCaseInput,
  UpdateBankAccountUseCaseOutput
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {
    super();
  }

  protected async handle({
    authenticatedUser,
    bankAccountId,
    institution,
    name,
    isMainAccount,
    balance,
  }: UpdateBankAccountUseCaseInput) {
    const bankAccount = await this.bankAccountRepository.findUniqueByIdFromUser(
      bankAccountId,
      authenticatedUser,
    );

    if (!bankAccount)
      return left(
        new ResourceNotFoundError(
          "Não é possível atualizar a conta bancária porquê ela não foi encontrada.",
        ),
      );

    if (institution) {
      const userBankAccountWithSameInstitution =
        await this.bankAccountRepository.findUniqueByInstitutionFromUser(
          institution,
          authenticatedUser,
        );

      if (
        userBankAccountWithSameInstitution &&
        !userBankAccountWithSameInstitution.id.equals(bankAccount.id)
      )
        return left(
          new ResourceAlreadyExistsError(
            `Uma conta bancária da instituição "${userBankAccountWithSameInstitution.institution.value}" já existe.`,
          ),
        );
    }

    if (name) {
      const userBankAccountWithSameName =
        await this.bankAccountRepository.findUniqueByNameFromUser(
          name,
          authenticatedUser,
        );

      if (
        userBankAccountWithSameName &&
        !userBankAccountWithSameName.id.equals(bankAccount.id)
      )
        return left(
          new ResourceAlreadyExistsError(
            `Uma conta bancária com o nome "${userBankAccountWithSameName.name.value}" já existe.`,
          ),
        );
    }

    if (isMainAccount) {
      const userMainBankAccount =
        await this.bankAccountRepository.findUniqueMainFromUser(
          authenticatedUser,
        );

      if (
        userMainBankAccount &&
        !userMainBankAccount.id.equals(bankAccount.id)
      ) {
        return left(
          new ResourceAlreadyExistsError(
            `Você já tem uma conta bancária marcada como principal. Edite a conta com o nome "${userMainBankAccount.name.value}" para poder atualizar uma conta dessa forma.`,
          ),
        );
      }
    }

    await this.bankAccountRepository.updateUnique(bankAccount, {
      institution,
      name,
      balance,
      isMainAccount,
    });

    return right({ bankAccount });
  }
}
