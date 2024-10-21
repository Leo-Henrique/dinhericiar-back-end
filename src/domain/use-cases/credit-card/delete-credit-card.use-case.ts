import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { CreditCard } from "@/domain/entities/credit-card.entity";
import { User } from "@/domain/entities/user.entity";
import { UniqueEntityId } from "@/domain/entities/value-objects/unique-entity.id";
import { ResourceNotFoundError } from "@/domain/errors";
import { CreditCardRepository } from "@/domain/gateways/repositories/credit-card.repository";
import { Injectable } from "@nestjs/common";

type DeleteCreditCardUseCaseInput = {
  authenticatedUser: User;
  creditCardId: UniqueEntityId["value"];
};

type DeleteCreditCardUseCaseOutput = Either<
  ResourceNotFoundError,
  {
    creditCard: CreditCard;
  }
>;

@Injectable()
export class DeleteCreditCardUseCase extends UseCase<
  DeleteCreditCardUseCaseInput,
  DeleteCreditCardUseCaseOutput
> {
  constructor(private readonly creditCardRepository: CreditCardRepository) {
    super();
  }

  protected async handle({
    authenticatedUser,
    creditCardId,
  }: DeleteCreditCardUseCaseInput) {
    const creditCard = await this.creditCardRepository.findUniqueByIdFromUser(
      creditCardId,
      authenticatedUser,
    );

    if (!creditCard)
      return left(
        new ResourceNotFoundError(
          "Não é possível deletar o cartão de crédito porquê ele não foi encontrado.",
        ),
      );

    await this.creditCardRepository.deleteUnique(creditCard);

    return right({ creditCard });
  }
}
