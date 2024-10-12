import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/schemas/pagination-params";
import { UseCase } from "@/core/use-case";
import { BankAccount } from "@/domain/entities/bank-account.entity";
import { User } from "@/domain/entities/user.entity";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { UnitOfWork } from "@/domain/gateways/unit-of-work";
import { Injectable } from "@nestjs/common";

type ListBankAccountsUseCaseInput = PaginationParams & {
  authenticatedUser: User;
};

type ListBankAccountsUseCaseOutput = Either<
  null,
  {
    bankAccounts: BankAccount[];
    totalBankAccounts: number;
    totalBalance: number;
  }
>;

@Injectable()
export class ListBankAccountsUseCase extends UseCase<
  ListBankAccountsUseCaseInput,
  ListBankAccountsUseCaseOutput
> {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {
    super();
  }

  protected async handle({
    authenticatedUser,
    ...listOptions
  }: ListBankAccountsUseCaseInput) {
    const [bankAccounts, totalBankAccounts, totalBalance] =
      await this.unitOfWork.transaction(session => {
        return Promise.all([
          this.bankAccountRepository.findManyFromUser(authenticatedUser, {
            ...listOptions,
            session,
          }),
          this.bankAccountRepository.countAllFromUser(authenticatedUser, {
            session,
          }),
          this.bankAccountRepository.sumAllBalanceFromUser(authenticatedUser, {
            session,
          }),
        ]);
      });

    return right({
      bankAccounts,
      totalBankAccounts,
      totalBalance,
    });
  }
}
