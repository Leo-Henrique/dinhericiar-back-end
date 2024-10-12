import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { BankAccount } from "@/domain/entities/bank-account.entity";
import { BankAccountSchemaToIdentify } from "@/domain/entities/schemas/bank-account.schema";
import { User } from "@/domain/entities/user.entity";
import { ResourceNotFoundError } from "@/domain/errors";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { Injectable } from "@nestjs/common";

type DeleteBankAccountUseCaseInput = {
  authenticatedUser: User;
  bankAccountId: BankAccountSchemaToIdentify["id"];
};

type DeleteBankAccountUseCaseOutput = Either<
  ResourceNotFoundError,
  {
    bankAccount: BankAccount;
  }
>;

@Injectable()
export class DeleteBankAccountUseCase extends UseCase<
  DeleteBankAccountUseCaseInput,
  DeleteBankAccountUseCaseOutput
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {
    super();
  }

  protected async handle({
    authenticatedUser,
    bankAccountId,
  }: DeleteBankAccountUseCaseInput) {
    const bankAccount = await this.bankAccountRepository.findUniqueByIdFromUser(
      bankAccountId,
      authenticatedUser,
    );

    if (!bankAccount)
      return left(
        new ResourceNotFoundError(
          "Não é possível deletar a conta bancária porquê ela não foi encontrada.",
        ),
      );

    await this.bankAccountRepository.deleteUnique(bankAccount);

    return right({ bankAccount });
  }
}
