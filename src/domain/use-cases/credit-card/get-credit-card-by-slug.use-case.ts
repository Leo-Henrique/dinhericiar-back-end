import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { CreditCard } from "@/domain/entities/credit-card.entity";
import { User } from "@/domain/entities/user.entity";
import { Slug } from "@/domain/entities/value-objects/slug";
import { ResourceNotFoundError } from "@/domain/errors";
import { CreditCardRepository } from "@/domain/gateways/repositories/credit-card.repository";
import { Injectable } from "@nestjs/common";

type GetCreditCardBySlugUseCaseInput = {
  authenticatedUser: User;
  slug: Slug["value"];
};

type GetCreditCardBySlugUseCaseOutput = Either<
  ResourceNotFoundError,
  {
    creditCard: CreditCard;
  }
>;

@Injectable()
export class GetCreditCardBySlugUseCase extends UseCase<
  GetCreditCardBySlugUseCaseInput,
  GetCreditCardBySlugUseCaseOutput
> {
  constructor(private readonly creditCardRepository: CreditCardRepository) {
    super();
  }

  protected async handle({
    authenticatedUser,
    slug,
  }: GetCreditCardBySlugUseCaseInput) {
    const creditCard = await this.creditCardRepository.findUniqueBySlugFromUser(
      slug,
      authenticatedUser,
    );

    if (!creditCard)
      return left(
        new ResourceNotFoundError("Cartão de crédito não encontrado."),
      );

    return right({ creditCard });
  }
}
