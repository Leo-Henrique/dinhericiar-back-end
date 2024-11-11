import { TransactionRecurrenceFixedEntity } from "@/domain/entities/transaction-recurrence-fixed.entity";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleTransactionDebitExpenseData } from "@/infra/database/drizzle/schemas/drizzle-transaction-debit-expense.schema";
import { DrizzleTransactionData } from "@/infra/database/drizzle/schemas/drizzle-transaction.schema";
import { BULL_MQ_TRANSACTION_QUEUE_NAME } from "@/infra/queues/bull-mq/queue-names";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { QueueEvents } from "bullmq";
import { sql } from "drizzle-orm";
import {
  BankAccountFactory,
  BankAccountFactoryOutput,
} from "test/factories/bank-account.factory";
import {
  TransactionCategoryFactory,
  TransactionCategoryFactoryOutput,
} from "test/factories/transaction-category.factory";
import { TransactionDebitExpenseFixedJobFactory } from "test/factories/transaction-debit-expense-fixed-job.factory";
import { TransactionDebitExpenseFactory } from "test/factories/transaction-debit-expense.factory";
import { TransactionRecurrenceFixedFactory } from "test/factories/transaction-recurrence-fixed.factory";
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { QueuesModule } from "../../queues.module";
import { redisClient } from "../../redis/redis.service";

describe("[Queue worker] fixed_transaction_debit_expense_job", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let bankAccountFactory: BankAccountFactory;
  let transactionCategoryFactory: TransactionCategoryFactory;
  let transactionRecurrenceFixedFactory: TransactionRecurrenceFixedFactory;
  let transactionDebitExpenseFactory: TransactionDebitExpenseFactory;
  let transactionDebitExpenseFixedJobFactory: TransactionDebitExpenseFixedJobFactory;
  let transactionDebitExpenseFixedQueueEvents: QueueEvents;

  let user: UserFactoryOutput;
  let bankAccount: BankAccountFactoryOutput;
  let transactionCategory: TransactionCategoryFactoryOutput;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, QueuesModule],
      providers: [
        UserFactory,
        BankAccountFactory,
        TransactionCategoryFactory,
        TransactionRecurrenceFixedFactory,
        TransactionDebitExpenseFactory,
        TransactionDebitExpenseFixedJobFactory,
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    userFactory = moduleRef.get(UserFactory);
    bankAccountFactory = moduleRef.get(BankAccountFactory);
    transactionCategoryFactory = moduleRef.get(TransactionCategoryFactory);
    transactionRecurrenceFixedFactory = moduleRef.get(
      TransactionRecurrenceFixedFactory,
    );
    transactionDebitExpenseFactory = moduleRef.get(
      TransactionDebitExpenseFactory,
    );
    transactionDebitExpenseFixedJobFactory = moduleRef.get(
      TransactionDebitExpenseFixedJobFactory,
    );
    transactionDebitExpenseFixedQueueEvents = new QueueEvents(
      BULL_MQ_TRANSACTION_QUEUE_NAME,
      { connection: redisClient },
    );

    user = await userFactory.makeAndSaveUnique();
    bankAccount = await bankAccountFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });
    transactionCategory = await transactionCategoryFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
      transactionType: "EXPENSE",
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    // await transactionDebitExpenseFixedQueue.close();
    await app.close();
  });

  describe("should be able to create a new batch of fixed transactions", () => {
    it.each([
      {
        name: "annual",
        period: "YEAR" as const,
        getExpectedTransactedDateFromInstallment: (
          lastTransactionDate: Date,
          installment: number,
        ) => {
          const expectedDate = new Date(lastTransactionDate.getTime());

          expectedDate.setFullYear(
            lastTransactionDate.getFullYear() + installment,
          );

          return expectedDate.getTime();
        },
      },
      {
        name: "monthly",
        period: "MONTH" as const,
        getExpectedTransactedDateFromInstallment: (
          lastTransactionDate: Date,
          installment: number,
        ) => {
          const expectedDate = new Date(lastTransactionDate.getTime());

          expectedDate.setMonth(lastTransactionDate.getMonth() + installment);

          return expectedDate.getTime();
        },
      },
      {
        name: "weekly",
        period: "WEEK" as const,
        getExpectedTransactedDateFromInstallment: (
          lastTransactionDate: Date,
          installment: number,
        ) => {
          const expectedDate = new Date(lastTransactionDate.getTime());

          expectedDate.setDate(lastTransactionDate.getDate() + 7 * installment);

          return expectedDate.getTime();
        },
      },
    ])(
      "with $name period",
      async ({ period, getExpectedTransactedDateFromInstallment }) => {
        const transactionRecurrenceFixed =
          await transactionRecurrenceFixedFactory.makeAndSaveUnique({
            period: period,
            interval: 1,
            occurrences: null,
          });

        const lastTransactionDebitExpense =
          await transactionDebitExpenseFactory.makeAndSaveUnique({
            bankAccountId: bankAccount.entity.id.value,
            transactionCategoryId: transactionCategory.entity.id.value,
            transactionRecurrenceId: transactionRecurrenceFixed.entity.id.value,
          });

        const transactionDebitExpenseFixedJob =
          await transactionDebitExpenseFixedJobFactory.makeAndSaveUnique({
            bankAccountId: bankAccount.entity.id.value,
            transactionCategoryId: transactionCategory.entity.id.value,
            transactionRecurrenceId: transactionRecurrenceFixed.entity.id.value,
          });

        const getTransactionDateFromInstallmentSpy = vi.spyOn(
          TransactionRecurrenceFixedEntity.prototype,
          "getTransactionDateFromInstallment",
        );

        await transactionDebitExpenseFixedJob.onDatabase.waitUntilFinished(
          transactionDebitExpenseFixedQueueEvents,
        );

        expect(getTransactionDateFromInstallmentSpy).toHaveBeenCalledTimes(
          TransactionRecurrenceFixedEntity.numberOfInitialTransactionsCreated,
        );
        expect(getTransactionDateFromInstallmentSpy).toHaveBeenNthCalledWith(
          1,
          lastTransactionDebitExpense.entity.transactedAt,
          2,
        );
        expect(getTransactionDateFromInstallmentSpy).toHaveBeenNthCalledWith(
          2,
          lastTransactionDebitExpense.entity.transactedAt,
          3,
        );

        const transactionDebitExpensesOnDatabase = await drizzle.executeToGet<
          DrizzleTransactionData & DrizzleTransactionDebitExpenseData
        >(sql`
            SELECT
              *
            FROM
              transactions
            INNER JOIN
              transaction_debit_expenses 
            ON 
              transaction_debit_expenses.transaction_id = transactions.id
            WHERE
              transactions.transaction_recurrence_id = ${transactionRecurrenceFixed.entity.id.value}
            AND
              transactions.id != ${lastTransactionDebitExpense.entity.id.value}
        `);

        expect(transactionDebitExpensesOnDatabase).toHaveLength(
          TransactionRecurrenceFixedEntity.numberOfInitialTransactionsCreated,
        );

        const {
          id, // eslint-disable-line @typescript-eslint/no-unused-vars,
          createdAt, // eslint-disable-line @typescript-eslint/no-unused-vars
          ...transactionJobDataCorrespondingToDatabaseData
        } = transactionDebitExpenseFixedJob.entity.getRawData();

        for (
          let transactionIndex = 0;
          transactionIndex < transactionDebitExpensesOnDatabase.length;
          transactionIndex++
        ) {
          const transactionDebitExpenseOnDatabase =
            transactionDebitExpensesOnDatabase[transactionIndex];

          expect(transactionDebitExpenseOnDatabase).toBeTruthy();
          expect(transactionDebitExpenseOnDatabase).toMatchObject(
            transactionJobDataCorrespondingToDatabaseData,
          );
          expect(transactionDebitExpenseOnDatabase.type).toEqual(
            "DEBIT_EXPENSE",
          );
          expect(transactionDebitExpenseOnDatabase.accomplishedAt).toBeNull();
          expect(
            transactionDebitExpenseOnDatabase.transactionRecurrenceId,
          ).toEqual(transactionRecurrenceFixed.entity.id.value);
          expect(transactionDebitExpenseOnDatabase.createdByQueue).toBe(true);

          const expectedTransactionDate =
            getExpectedTransactedDateFromInstallment(
              lastTransactionDebitExpense.entity.transactedAt,
              transactionIndex + 1,
            );

          expect(
            transactionDebitExpenseOnDatabase.transactedAt.getTime(),
          ).toEqual(expectedTransactionDate);
        }
      },
    );
  });

  it("should not be able to process job with a non-existing bank account", async () => {
    const transactionDebitExpenseFixedJob =
      await transactionDebitExpenseFixedJobFactory.makeAndSaveUnique();
    const result =
      await transactionDebitExpenseFixedJob.onDatabase.waitUntilFinished(
        transactionDebitExpenseFixedQueueEvents,
      );

    expect(result.reason.error).toEqual("ResourceNotFoundError");
    expect(result.reason.message).toContain(
      "conta bancária não foi encontrada",
    );
  });

  it("should not be able to process job with a non-existing transaction category", async () => {
    const transactionDebitExpenseFixedJob =
      await transactionDebitExpenseFixedJobFactory.makeAndSaveUnique({
        bankAccountId: bankAccount.entity.id.value,
      });

    const result =
      await transactionDebitExpenseFixedJob.onDatabase.waitUntilFinished(
        transactionDebitExpenseFixedQueueEvents,
      );

    expect(result.reason.error).toEqual("ResourceNotFoundError");
    expect(result.reason.message).toContain("categoria não foi encontrada");
  });

  it("should not be able to process job with a non-existing transaction recurrence", async () => {
    const transactionDebitExpenseFixedJob =
      await transactionDebitExpenseFixedJobFactory.makeAndSaveUnique({
        bankAccountId: bankAccount.entity.id.value,
        transactionCategoryId: transactionCategory.entity.id.value,
      });
    const result =
      await transactionDebitExpenseFixedJob.onDatabase.waitUntilFinished(
        transactionDebitExpenseFixedQueueEvents,
      );

    expect(result.reason.error).toEqual("ResourceNotFoundError");
    expect(result.reason.message).toContain(
      "dados da recorrência não foram encontrados",
    );
  });
});
