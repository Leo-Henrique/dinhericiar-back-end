import { Either, right } from "@/core/either";
import { PaginationParams } from "@/core/schemas/pagination-params";
import { UseCase } from "@/core/use-case";
import { CreditCard } from "@/domain/entities/credit-card.entity";
import { User } from "@/domain/entities/user.entity";
import { CreditCardRepository } from "@/domain/gateways/repositories/credit-card.repository";
import { UnitOfWork } from "@/domain/gateways/unit-of-work";
import { Injectable } from "@nestjs/common";

type ListCreditCardsUseCaseInput = PaginationParams & {
  authenticatedUser: User;
};

type ListCreditCardsUseCaseOutput = Either<
  null,
  {
    creditCards: CreditCard[];
    totalCreditCards: number;
  }
>;

@Injectable()
export class ListCreditCardsUseCase extends UseCase<
  ListCreditCardsUseCaseInput,
  ListCreditCardsUseCaseOutput
> {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {
    super();
  }

  protected async handle({
    authenticatedUser,
    ...listOptions
  }: ListCreditCardsUseCaseInput) {
    const [creditCards, totalCreditCards] = await this.unitOfWork.transaction(
      session => {
        return Promise.all([
          this.creditCardRepository.findManyFromUser(authenticatedUser, {
            ...listOptions,
            session,
          }),
          this.creditCardRepository.countAllFromUser(authenticatedUser, {
            session,
          }),
        ]);
      },
    );

    return right({
      creditCards,
      totalCreditCards,
    });
  }
}
