import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import {
  CreditCard,
  CreditCardEntity,
} from "@/domain/entities/credit-card.entity";
import { CreditCardSchemaToCreate } from "@/domain/entities/schemas/credit-card.schema";

import { User } from "@/domain/entities/user.entity";
import {
  ResourceAlreadyExistsError,
  ResourceNotFoundError,
} from "@/domain/errors";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { CreditCardRepository } from "@/domain/gateways/repositories/credit-card.repository";
import { Injectable } from "@nestjs/common";

type CreateCreditCardUseCaseInput = CreditCardSchemaToCreate & {
  authenticatedUser: User;
};

type CreateCreditCardUseCaseOutput = Either<
  ResourceNotFoundError | ResourceAlreadyExistsError,
  {
    creditCard: CreditCard;
  }
>;

@Injectable()
export class CreateCreditCardUseCase extends UseCase<
  CreateCreditCardUseCaseInput,
  CreateCreditCardUseCaseOutput
> {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly creditCardRepository: CreditCardRepository,
  ) {
    super();
  }

  protected async handle({
    authenticatedUser,
    bankAccountId,
    name,
    isMainCard,
    ...restInput
  }: CreateCreditCardUseCaseInput) {
    const bankAccount = await this.bankAccountRepository.findUniqueByIdFromUser(
      bankAccountId,
      authenticatedUser,
    );

    if (!bankAccount)
      return left(
        new ResourceNotFoundError(
          "Não é possível criar o cartão de crédito porquê a conta bancária não foi encontrada.",
        ),
      );

    const userCreditCardWithSameName =
      await this.creditCardRepository.findUniqueByNameFromUser(
        name,
        authenticatedUser,
      );

    if (userCreditCardWithSameName)
      return left(
        new ResourceAlreadyExistsError(
          `Um cartão de crédito com o nome "${userCreditCardWithSameName.name}" já existe.`,
        ),
      );

    if (isMainCard) {
      const userMainCreditCard =
        await this.creditCardRepository.findUniqueMainFromUser(
          authenticatedUser,
        );

      if (userMainCreditCard) {
        return left(
          new ResourceAlreadyExistsError(
            `Você já tem um cartão de crédito marcado como principal. Edite o cartão com o nome "${userMainCreditCard.name}" para poder criar outro cartão dessa forma.`,
          ),
        );
      }
    }

    const creditCard = CreditCardEntity.create({
      bankAccountId,
      name,
      isMainCard,
      ...restInput,
    });

    await this.creditCardRepository.createUnique(creditCard);

    return right({ creditCard });
  }
}
