import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { TransactionDebitExpenseSchemaToCreateInstallment } from "@/domain/entities/schemas/transaction-debit-expense.schema";

import {
  TransactionCategory,
  TransactionCategoryEntity,
} from "@/domain/entities/transaction-category.entity";
import {
  TransactionDebitExpense,
  TransactionDebitExpenseEntity,
} from "@/domain/entities/transaction-debit-expense.entity";
import { TransactionRecurrenceInstallmentEntity } from "@/domain/entities/transaction-recurrence-installment.entity";
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

type CreateInstallmentTransactionDebitExpenseUseCaseInput =
  TransactionDebitExpenseSchemaToCreateInstallment & {
    authenticatedUser: User;
  };

type CreateInstallmentTransactionDebitExpenseUseCaseOutput = Either<
  ResourceNotFoundError | ResourceAlreadyExistsError,
  {
    transactionDebitExpenses: TransactionDebitExpense[];
  }
>;

@Injectable()
export class CreateInstallmentTransactionDebitExpenseUseCase extends UseCase<
  CreateInstallmentTransactionDebitExpenseUseCaseInput,
  CreateInstallmentTransactionDebitExpenseUseCaseOutput
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
    transactedAt,
    isAccomplished,
    amount,
    installmentPeriod,
    installmentNumber,
    ...restInput
  }: CreateInstallmentTransactionDebitExpenseUseCaseInput) {
    const bankAccount = await this.bankAccountRepository.findUniqueByIdFromUser(
      bankAccountId,
      authenticatedUser,
    );

    if (!bankAccount)
      return left(
        new ResourceNotFoundError(
          "Não é possível criar a transação parcelada porquê a conta bancária não foi encontrada.",
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

    const transactionRecurrenceInstallment =
      TransactionRecurrenceInstallmentEntity.create({
        period: installmentPeriod,
        installments: installmentNumber,
      });

    const transactionDebitExpenses: TransactionDebitExpense[] = [];

    for (let index = 0; index < installmentNumber; index++) {
      const installmentTransactedAt = new Date(transactedAt.getTime());

      if (installmentPeriod === "YEAR") {
        installmentTransactedAt.setFullYear(
          installmentTransactedAt.getFullYear() + index,
        );
      }

      if (installmentPeriod === "MONTH") {
        installmentTransactedAt.setMonth(
          installmentTransactedAt.getMonth() + index,
        );
      }

      if (installmentPeriod === "WEEK") {
        installmentTransactedAt.setDate(
          installmentTransactedAt.getDate() + 7 * index,
        );
      }

      const transactionDebitExpense = TransactionDebitExpenseEntity.create({
        ...restInput,
        bankAccountId,
        transactionCategoryId: transactionCategory.id.value,
        transactionRecurrenceId: transactionRecurrenceInstallment.id.value,
        transactedAt: installmentTransactedAt,
        isAccomplished: index === 0 ? isAccomplished : false,
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

      await this.debitExpenseTransactionRepository.createManyWithInstallmentRecurrence(
        transactionDebitExpenses,
        transactionRecurrenceInstallment,
        { session },
      );
    });

    return right({ transactionDebitExpenses });
  }
}
