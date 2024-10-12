import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { BankAccount } from "@/domain/entities/bank-account.entity";
import { User } from "@/domain/entities/user.entity";
import { Slug } from "@/domain/entities/value-objects/slug";
import { ResourceNotFoundError } from "@/domain/errors";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { Injectable } from "@nestjs/common";

type GetBankAccountBySlugUseCaseInput = {
  authenticatedUser: User;
  slug: Slug["value"];
};

type GetBankAccountBySlugUseCaseOutput = Either<
  ResourceNotFoundError,
  {
    bankAccount: BankAccount;
  }
>;

@Injectable()
export class GetBankAccountBySlugUseCase extends UseCase<
  GetBankAccountBySlugUseCaseInput,
  GetBankAccountBySlugUseCaseOutput
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {
    super();
  }

  protected async handle({
    authenticatedUser,
    slug,
  }: GetBankAccountBySlugUseCaseInput) {
    const bankAccount =
      await this.bankAccountRepository.findUniqueBySlugFromUser(
        slug,
        authenticatedUser,
      );

    if (!bankAccount)
      return left(new ResourceNotFoundError("Conta bancária não encontrada."));

    return right({ bankAccount });
  }
}
