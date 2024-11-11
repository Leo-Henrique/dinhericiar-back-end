import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { TransactionDebitExpenseFixedJobEntity } from "@/domain/entities/queues/transaction-debit-expense-fixed-job.entity";
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
import { TransactionDebitExpenseFixedJobRepository } from "@/domain/gateways/repositories/queues/transaction-debit-expense-job.repository";
import { TransactionCategoryRepository } from "@/domain/gateways/repositories/transaction-category.repository";
import { TransactionDebitExpenseRepository } from "@/domain/gateways/repositories/transaction-debit-expense.repository";
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
    private readonly transactionDebitExpenseRepository: TransactionDebitExpenseRepository,
    private readonly transactionDebitExpenseFixedJobRepository: TransactionDebitExpenseFixedJobRepository,
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
    description,
    fixedPeriod,
    fixedInterval,
    fixedOccurrences,
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

      const accomplishedAt = isAccomplished ? new Date() : null;
      const transactionDebitExpense = TransactionDebitExpenseEntity.create({
        bankAccountId,
        transactionCategoryId: transactionCategory.id.value,
        transactionRecurrenceId: transactionRecurrenceFixed.id.value,
        transactedAt: installmentTransactedAt,
        accomplishedAt: currentInstallment === 1 ? accomplishedAt : null,
        amount,
        description,
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

      await this.transactionDebitExpenseRepository.createManyWithFixedRecurrence(
        transactionDebitExpenses,
        transactionRecurrenceFixed,
        {
          session,
          createRecurrence: true,
        },
      );

      const middleTransactionDebitExpenseIndex = Math.floor(
        transactionDebitExpenses.length / 2,
      );
      const middleTransactionDebitExpense =
        transactionDebitExpenses[middleTransactionDebitExpenseIndex];
      const transactionDebitExpenseFixedJob =
        TransactionDebitExpenseFixedJobEntity.create({
          bankAccountId,
          transactionCategoryId: transactionCategory.id.value,
          transactionRecurrenceId: transactionRecurrenceFixed.id.value,
          amount,
          description,
        });

      const executionIntervalInMillisecondsBetweenEachJob =
        (middleTransactionDebitExpense.transactedAt.getTime() - Date.now()) * 2;

      await this.transactionDebitExpenseFixedJobRepository.createRepeatable(
        transactionDebitExpenseFixedJob,
        {
          firstJobExecutionDate: middleTransactionDebitExpense.transactedAt,
          executionIntervalInMillisecondsBetweenEachJob,
        },
      );
    });

    return right({ transactionDebitExpenses });
  }
}
