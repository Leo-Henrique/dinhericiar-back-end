import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { CreditCard } from "@/domain/entities/credit-card.entity";
import { CreditCardSchemaToUpdate } from "@/domain/entities/schemas/credit-card.schema";
import { User } from "@/domain/entities/user.entity";
import { UniqueEntityId } from "@/domain/entities/value-objects/unique-entity.id";
import {
  ResourceAlreadyExistsError,
  ResourceNotFoundError,
} from "@/domain/errors";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { CreditCardRepository } from "@/domain/gateways/repositories/credit-card.repository";
import { Injectable } from "@nestjs/common";

type UpdateCreditCardUseCaseInput = CreditCardSchemaToUpdate & {
  authenticatedUser: User;
  creditCardId: UniqueEntityId["value"];
};

type UpdateCreditCardUseCaseOutput = Either<
  ResourceNotFoundError | ResourceAlreadyExistsError,
  {
    creditCard: CreditCard;
  }
>;

@Injectable()
export class UpdateCreditCardUseCase extends UseCase<
  UpdateCreditCardUseCaseInput,
  UpdateCreditCardUseCaseOutput
> {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly bankAccountRepository: BankAccountRepository,
  ) {
    super();
  }

  protected async handle({
    authenticatedUser,
    creditCardId,
    bankAccountId,
    name,
    isMainCard,
    ...restInput
  }: UpdateCreditCardUseCaseInput) {
    const creditCard = await this.creditCardRepository.findUniqueByIdFromUser(
      creditCardId,
      authenticatedUser,
    );

    if (!creditCard)
      return left(
        new ResourceNotFoundError(
          "Não é possível atualizar o cartão de crédito porquê ele não foi encontrado.",
        ),
      );

    if (bankAccountId) {
      const bankAccount =
        await this.bankAccountRepository.findUniqueByIdFromUser(
          bankAccountId,
          authenticatedUser,
        );

      if (!bankAccount)
        return left(
          new ResourceNotFoundError(
            "Não é possível atualizar o cartão de crédito porquê a nova conta bancária não foi encontrada.",
          ),
        );
    }

    if (name) {
      const userCreditCardWithSameName =
        await this.creditCardRepository.findUniqueByNameFromUser(
          name,
          authenticatedUser,
        );

      if (
        userCreditCardWithSameName &&
        !userCreditCardWithSameName.id.equals(creditCard.id)
      )
        return left(
          new ResourceAlreadyExistsError(
            `Um cartão de crédito com o nome "${userCreditCardWithSameName.name}" já existe.`,
          ),
        );
    }

    if (isMainCard) {
      const userMainCreditCard =
        await this.creditCardRepository.findUniqueMainFromUser(
          authenticatedUser,
        );

      if (userMainCreditCard && !userMainCreditCard.id.equals(creditCard.id)) {
        return left(
          new ResourceAlreadyExistsError(
            `Você já tem um cartão de crédito marcado como principal. Edite o cartão com o nome "${userMainCreditCard.name}" para poder atualizar um cartão dessa forma.`,
          ),
        );
      }
    }

    await this.creditCardRepository.updateUnique(creditCard, {
      name,
      bankAccountId,
      isMainCard,
      ...restInput,
    });

    return right({ creditCard });
  }
}
