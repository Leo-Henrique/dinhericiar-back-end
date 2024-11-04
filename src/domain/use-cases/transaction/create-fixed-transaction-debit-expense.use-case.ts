import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { TransactionDebitExpenseSchemaToCreateFixed } from "@/domain/entities/schemas/transaction-debit-expense.schema";

import {
  TransactionCategory,
  TransactionCategoryEntity,
} from "@/domain/entities/transaction-category.entity";
import {
  TransactionDebitExpense,
  TransactionDebitExpenseEntity,
} from "@/domain/entities/transaction-debit-expense.entity";
import { TransactionRecurrenceFixedEntity } from "@/domain/entities/transaction-recurrence-fixed.entity";
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

type CreateFixedTransactionDebitExpenseUseCaseInput =
  TransactionDebitExpenseSchemaToCreateFixed & {
    authenticatedUser: User;
  };

type CreateFixedTransactionDebitExpenseUseCaseOutput = Either<
  ResourceNotFoundError | ResourceAlreadyExistsError,
  {
    transactionDebitExpenses: TransactionDebitExpense[];
  }
>;

@Injectable()
export class CreateFixedTransactionDebitExpenseUseCase extends UseCase<
  CreateFixedTransactionDebitExpenseUseCaseInput,
  CreateFixedTransactionDebitExpenseUseCaseOutput
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
    isAccomplished,
    amount,
    fixedPeriod,
    fixedInterval,
    fixedOccurrences,
    ...restInput
  }: CreateFixedTransactionDebitExpenseUseCaseInput) {
    const bankAccount = await this.bankAccountRepository.findUniqueByIdFromUser(
      bankAccountId,
      authenticatedUser,
    );

    if (!bankAccount)
      return left(
        new ResourceNotFoundError(
          "Não é possível criar a transação fixa porquê a conta bancária não foi encontrada.",
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

    const transactionRecurrenceFixed = TransactionRecurrenceFixedEntity.create({
      period: fixedPeriod,
      interval: fixedInterval,
      occurrences: fixedOccurrences,
    });

    const transactionDebitExpenses: TransactionDebitExpense[] = [];
    const now = new Date();

    for (
      let currentInstallment = 1;
      currentInstallment <=
      TransactionRecurrenceFixedEntity.numberOfInitialTransactionsCreated;
      currentInstallment++
    ) {
      const installmentTransactedAt =
        transactionRecurrenceFixed.getTransactionDateFromInstallment(
          now,
          currentInstallment,
        );

      const transactionDebitExpense = TransactionDebitExpenseEntity.create({
        ...restInput,
        bankAccountId,
        transactionCategoryId: transactionCategory.id.value,
        transactionRecurrenceId: transactionRecurrenceFixed.id.value,
        transactedAt: installmentTransactedAt,
        isAccomplished: currentInstallment === 1 ? isAccomplished : false,
        amount,
      });

      transactionDebitExpenses.push(transactionDebitExpense);
    }

    await this.unitOfWork.transaction(async session => {
      if (!transactionCategoryOnDatabase) {
        await this.transactionCategoryRepository.createUnique(
          transactionCategory,
          { session },
        );
      }

      if (isAccomplished) {
        await this.bankAccountRepository.updateUniqueToDecreaseBalance(
          bankAccount,
          amount,
          { session },
        );
      }

      await this.debitExpenseTransactionRepository.createManyWithFixedRecurrence(
        transactionDebitExpenses,
        transactionRecurrenceFixed,
        { session },
      );
    });

    return right({ transactionDebitExpenses });
  }
}
