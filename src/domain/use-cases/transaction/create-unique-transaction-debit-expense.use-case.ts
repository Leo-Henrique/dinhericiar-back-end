import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { TransactionDebitExpenseSchemaToCreateUnique } from "@/domain/entities/schemas/transaction-debit-expense.schema";

import {
  TransactionCategory,
  TransactionCategoryEntity,
} from "@/domain/entities/transaction-category.entity";
import {
  TransactionDebitExpense,
  TransactionDebitExpenseEntity,
} from "@/domain/entities/transaction-debit-expense.entity";
import { User } from "@/domain/entities/user.entity";
import {
  ResourceAlreadyExistsError,
  ResourceNotFoundError,
} from "@/domain/errors";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { TransactionDebitExpenseRepository } from "@/domain/gateways/repositories/debit-expense-transaction.repository";
import { TransactionCategoryRepository } from "@/domain/gateways/repositories/transaction-category.repository";
import { UnitOfWork } from "@/domain/gateways/unit-of-work";
import { Injectable } from "@nestjs/common";

type CreateUniqueTransactionDebitExpenseUseCaseInput =
  TransactionDebitExpenseSchemaToCreateUnique & {
    authenticatedUser: User;
  };

type CreateUniqueTransactionDebitExpenseUseCaseOutput = Either<
  ResourceNotFoundError | ResourceAlreadyExistsError,
  {
    transactionDebitExpense: TransactionDebitExpense;
  }
>;

@Injectable()
export class CreateUniqueTransactionDebitExpenseUseCase extends UseCase<
  CreateUniqueTransactionDebitExpenseUseCaseInput,
  CreateUniqueTransactionDebitExpenseUseCaseOutput
> {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
    private readonly debitExpenseTransactionRepository: TransactionDebitExpenseRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {
    super();
  }

  protected async handle({
    authenticatedUser,
    bankAccountId,
    categoryName,
    ...restInput
  }: CreateUniqueTransactionDebitExpenseUseCaseInput) {
    const bankAccount = await this.bankAccountRepository.findUniqueByIdFromUser(
      bankAccountId,
      authenticatedUser,
    );

    if (!bankAccount)
      return left(
        new ResourceNotFoundError(
          "Não é possível criar a transação porquê a conta bancária não foi encontrada.",
        ),
      );

    let transactionCategory: TransactionCategory;

    const transactionCategoryOnDatabase =
      await this.transactionCategoryRepository.findUniqueExpenseByNameFromUser(
        categoryName,
        authenticatedUser,
      );

    if (transactionCategoryOnDatabase) {
      transactionCategory = transactionCategoryOnDatabase;
    } else {
      transactionCategory = TransactionCategoryEntity.create({
        userId: authenticatedUser.id.value,
        transactionType: "EXPENSE",
        name: categoryName,
      });
    }

    const transactionDebitExpense = TransactionDebitExpenseEntity.create({
      bankAccountId,
      transactionCategoryId: transactionCategory.id.value,
      ...restInput,
    });
    const { accomplishedAt, amount } = transactionDebitExpense;

    await this.unitOfWork.transaction(async session => {
      if (!transactionCategoryOnDatabase) {
        await this.transactionCategoryRepository.createUnique(
          transactionCategory,
          { session },
        );
      }

      if (accomplishedAt) {
        await this.bankAccountRepository.updateUniqueToDecreaseBalance(
          bankAccount,
          amount,
          { session },
        );
      }

      await this.debitExpenseTransactionRepository.createUnique(
        transactionDebitExpense,
        { session },
      );
    });

    return right({ transactionDebitExpense });
  }
}
