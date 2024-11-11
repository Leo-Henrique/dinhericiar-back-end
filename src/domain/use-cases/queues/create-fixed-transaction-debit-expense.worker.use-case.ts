import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { TransactionDebitExpenseFixedJob } from "@/domain/entities/queues/transaction-debit-expense-fixed-job.entity";

import {
  TransactionDebitExpense,
  TransactionDebitExpenseEntity,
} from "@/domain/entities/transaction-debit-expense.entity";
import { TransactionRecurrenceFixedEntity } from "@/domain/entities/transaction-recurrence-fixed.entity";
import { ResourceNotFoundError } from "@/domain/errors";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { TransactionCategoryRepository } from "@/domain/gateways/repositories/transaction-category.repository";
import { TransactionDebitExpenseRepository } from "@/domain/gateways/repositories/transaction-debit-expense.repository";
import { TransactionRecurrenceFixedRepository } from "@/domain/gateways/repositories/transaction-recurrence-fixed.repository";
import { UnitOfWork } from "@/domain/gateways/unit-of-work";
import { Injectable } from "@nestjs/common";

type CreateFixedTransactionDebitExpenseWorkerUseCaseInput = {
  transactionDebitExpenseFixedJob: TransactionDebitExpenseFixedJob;
};

export type CreateFixedTransactionDebitExpenseWorkerUseCaseOutput = Either<
  ResourceNotFoundError,
  {
    transactionDebitExpenses: TransactionDebitExpense[];
  }
>;

@Injectable()
export class CreateFixedTransactionDebitExpenseWorkerUseCase extends UseCase<
  CreateFixedTransactionDebitExpenseWorkerUseCaseInput,
  CreateFixedTransactionDebitExpenseWorkerUseCaseOutput
> {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly transactionCategoryRepository: TransactionCategoryRepository,
    private readonly transactionRecurrenceFixedRepository: TransactionRecurrenceFixedRepository,
    private readonly transactionDebitExpenseRepository: TransactionDebitExpenseRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {
    super();
  }

  protected async handle({
    transactionDebitExpenseFixedJob,
  }: CreateFixedTransactionDebitExpenseWorkerUseCaseInput) {
    const {
      bankAccountId,
      transactionCategoryId,
      transactionRecurrenceId,
      amount,
      description,
    } = transactionDebitExpenseFixedJob;

    const bankAccount = await this.bankAccountRepository.findUniqueById(
      bankAccountId.value,
    );

    if (!bankAccount)
      return left(
        new ResourceNotFoundError(
          "Não é possível criar a transação fixa porquê a conta bancária não foi encontrada.",
        ),
      );

    const transactionCategory =
      await this.transactionCategoryRepository.findUniqueById(
        transactionCategoryId.value,
      );

    if (!transactionCategory)
      return left(
        new ResourceNotFoundError(
          "Não é possível criar a transação fixa porquê a categoria não foi encontrada.",
        ),
      );

    const transactionRecurrenceFixed =
      await this.transactionRecurrenceFixedRepository.findUniqueById(
        transactionRecurrenceId.value,
      );

    if (!transactionRecurrenceFixed)
      return left(
        new ResourceNotFoundError(
          "Não é possível criar a transação fixa porquê os dados da recorrência não foram encontrados.",
        ),
      );

    const lastTransactionDebitExpense =
      await this.transactionDebitExpenseRepository.findUniqueLastOfFixedRecurrence(
        transactionRecurrenceFixed,
      );

    const transactionDebitExpenses: TransactionDebitExpense[] = [];

    for (
      let currentInstallment = 2;
      currentInstallment <=
      TransactionRecurrenceFixedEntity.numberOfInitialTransactionsCreated + 1;
      currentInstallment++
    ) {
      const installmentTransactedAt =
        transactionRecurrenceFixed.getTransactionDateFromInstallment(
          lastTransactionDebitExpense?.transactedAt,
          currentInstallment,
        );

      const transactionDebitExpense = TransactionDebitExpenseEntity.create({
        bankAccountId: bankAccount.id.value,
        transactionCategoryId: transactionCategory.id.value,
        transactionRecurrenceId: transactionRecurrenceFixed.id.value,
        transactedAt: installmentTransactedAt,
        createdByQueue: true,
        amount,
        description,
      });

      transactionDebitExpenses.push(transactionDebitExpense);
    }

    await this.unitOfWork.transaction(async session => {
      await this.transactionDebitExpenseRepository.createManyWithFixedRecurrence(
        transactionDebitExpenses,
        transactionRecurrenceFixed,
        {
          session,
          createRecurrence: false,
        },
      );
    });

    return right({ transactionDebitExpenses });
  }
}
