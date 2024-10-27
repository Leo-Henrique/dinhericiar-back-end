import {
  TransactionDebitExpenseSchemaToCreateInstallment,
  TransactionDebitExpenseSchemaToCreateUnique,
} from "@/domain/entities/schemas/transaction-debit-expense.schema";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleBankAccountData } from "@/infra/database/drizzle/schemas/drizzle-bank-account.schema";
import { DrizzleTransactionCategoryData } from "@/infra/database/drizzle/schemas/drizzle-transaction-category.schema";
import { DrizzleTransactionDebitExpenseData } from "@/infra/database/drizzle/schemas/drizzle-transaction-debit-expense.schema";
import { DrizzleTransactionRecurrenceData } from "@/infra/database/drizzle/schemas/drizzle-transaction-recurrence.schema";
import { DrizzleTransactionData } from "@/infra/database/drizzle/schemas/drizzle-transaction.schema";
import { faker } from "@faker-js/faker";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";
import {
  BankAccountFactory,
  BankAccountFactoryOutput,
} from "test/factories/bank-account.factory";
import {
  SessionFactory,
  SessionFactoryOutput,
} from "test/factories/session.factory";
import {
  TransactionCategoryFactory,
  TransactionCategoryFactoryOutput,
} from "test/factories/transaction-category.factory";
import { TransactionDebitExpenseFactory } from "test/factories/transaction-debit-expense.factory";
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CreateTransactionDebitExpenseControllerQuery } from "./create-transaction-debit-expense.controller";

describe("[Controller] POST /transactions/expenses", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;
  let transactionCategoryFactory: TransactionCategoryFactory;
  let transactionDebitExpenseFactory: TransactionDebitExpenseFactory;

  let user: UserFactoryOutput;
  let anotherUser: UserFactoryOutput;
  let session: SessionFactoryOutput;
  let bankAccount: BankAccountFactoryOutput;
  let bankAccountFromAnotherUser: BankAccountFactoryOutput;
  let transactionCategory: TransactionCategoryFactoryOutput;
  let transactionCategoryFromAnotherUser: TransactionCategoryFactoryOutput;

  let uniqueTransactionInput: TransactionDebitExpenseSchemaToCreateUnique;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        UserFactory,
        SessionFactory,
        BankAccountFactory,
        TransactionCategoryFactory,
        TransactionDebitExpenseFactory,
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    userFactory = moduleRef.get(UserFactory);
    sessionFactory = moduleRef.get(SessionFactory);
    bankAccountFactory = moduleRef.get(BankAccountFactory);
    transactionCategoryFactory = moduleRef.get(TransactionCategoryFactory);
    transactionDebitExpenseFactory = moduleRef.get(
      TransactionDebitExpenseFactory,
    );

    [user, anotherUser] = await userFactory.makeAndSaveManyByAmount(2);
    session = await sessionFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });
    [bankAccount, bankAccountFromAnotherUser] =
      await bankAccountFactory.makeAndSaveMany([
        { userId: user.entity.id.value },
        { userId: anotherUser.entity.id.value },
      ]);
    [transactionCategory, transactionCategoryFromAnotherUser] =
      await transactionCategoryFactory.makeAndSaveMany([
        { userId: user.entity.id.value, transactionType: "EXPENSE" },
        { userId: anotherUser.entity.id.value, transactionType: "EXPENSE" },
      ]);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    uniqueTransactionInput = {
      bankAccountId: faker.string.uuid(),
      categoryName: faker.lorem.sentence(),
      transactedAt: faker.date.recent(),
      isAccomplished: false,
      description: faker.lorem.sentence(),
      amount: faker.number.float({ min: 1, fractionDigits: 2 }),
    };
  });

  describe("with or without recurrence", () => {
    const casesForEachRecurrence = [
      {
        queryInput: { recurrence: undefined },
        overrideBodyInput: {},
      },
      {
        queryInput: { recurrence: "INSTALLMENT" },
        overrideBodyInput: {
          installmentPeriod: "MONTH",
          installmentNumber: 2,
        },
      },
    ];

    it.each(casesForEachRecurrence)(
      "decrease bank account balance if it has been marked as accomplished (recurrence: $queryInput.recurrence)",
      async ({ queryInput, overrideBodyInput }) => {
        const response = await request(app.getHttpServer())
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(queryInput)
          .send({
            ...uniqueTransactionInput,
            ...overrideBodyInput,
            bankAccountId: bankAccount.entity.id.value,
            isAccomplished: true,
          } satisfies TransactionDebitExpenseSchemaToCreateUnique);

        expect(response.statusCode).toEqual(201);

        const [bankAccountOnDatabase] =
          await drizzle.executeToGet<DrizzleBankAccountData>(sql`
            SELECT
              *
            FROM 
              bank_accounts
            WHERE
              id = ${bankAccount.entity.id.value}
      `);

        const { balance: decreasedBalance } = bankAccount.entity.update({
          balance: bankAccount.entity.balance - uniqueTransactionInput.amount,
        });

        expect(bankAccountOnDatabase.balance).toEqual(decreasedBalance);
      },
    );

    it.each(casesForEachRecurrence)(
      "should not be able to create a transaction with a non-existing bank account from user (recurrence: $queryInput.recurrence)",
      async ({ queryInput, overrideBodyInput }) => {
        const response = await request(app.getHttpServer())
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(queryInput)
          .send({
            ...uniqueTransactionInput,
            ...overrideBodyInput,
            bankAccountId: faker.string.uuid(),
          } satisfies TransactionDebitExpenseSchemaToCreateUnique);

        expect(response.statusCode).toEqual(400);
        expect(response.body.error).toEqual("ResourceNotFoundError");

        const bankAccountFromAnotherUserResponse = await request(
          app.getHttpServer(),
        )
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(queryInput)
          .send({
            ...uniqueTransactionInput,
            ...overrideBodyInput,
            bankAccountId: bankAccountFromAnotherUser.entity.id.value,
          } satisfies TransactionDebitExpenseSchemaToCreateUnique);

        expect(bankAccountFromAnotherUserResponse.statusCode).toEqual(400);
        expect(bankAccountFromAnotherUserResponse.body.error).toEqual(
          "ResourceNotFoundError",
        );
      },
    );

    describe("transaction category", () => {
      it.each(casesForEachRecurrence)(
        "should be able to associate existing transaction category to transaction (recurrence: $queryInput.recurrence)",
        async ({ queryInput, overrideBodyInput }) => {
          const response = await request(app.getHttpServer())
            .post("/transactions/expenses")
            .set("Cookie", getSessionCookie(session.entity))
            .query(queryInput)
            .send({
              ...uniqueTransactionInput,
              ...overrideBodyInput,
              bankAccountId: bankAccount.entity.id.value,
              categoryName: transactionCategory.entity.name,
            } satisfies TransactionDebitExpenseSchemaToCreateUnique);

          expect(response.statusCode).toEqual(201);

          const transactionOnDatabase =
            await transactionDebitExpenseFactory.getLastCreatedWithCategory();

          expect(transactionOnDatabase).toMatchObject({
            transactionCategoryId: transactionCategory.entity.id.value,
            categoryName: transactionCategory.entity.name,
            transactionType: "EXPENSE",
          });
        },
      );

      it.each(casesForEachRecurrence)(
        "should be able to create a transaction category if it does not exist for the user (recurrence: $queryInput.recurrence)",
        async ({ queryInput, overrideBodyInput }) => {
          const nonExistingTransactionCategoryName = faker.lorem.sentence();
          const response = await request(app.getHttpServer())
            .post("/transactions/expenses")
            .set("Cookie", getSessionCookie(session.entity))
            .query(queryInput)
            .send({
              ...uniqueTransactionInput,
              ...overrideBodyInput,
              bankAccountId: bankAccount.entity.id.value,
              categoryName: nonExistingTransactionCategoryName,
            } satisfies TransactionDebitExpenseSchemaToCreateUnique);

          expect(response.statusCode).toEqual(201);

          const [transactionCategoryOnDatabase] =
            await drizzle.executeToGet<DrizzleTransactionCategoryData>(sql`
            SELECT
              *
            FROM 
              transaction_categories
            WHERE
              user_id = ${user.entity.id.value}
            AND
              transaction_type = 'EXPENSE'
            AND
              name = ${nonExistingTransactionCategoryName}
        `);

          expect(transactionCategoryOnDatabase).toBeTruthy();

          const transactionOnDatabase =
            await transactionDebitExpenseFactory.getLastCreatedWithCategory();

          expect(transactionOnDatabase).toMatchObject({
            transactionCategoryId: transactionCategoryOnDatabase.id,
            categoryName: transactionCategoryOnDatabase.name,
            transactionType: "EXPENSE",
          });

          const transactionCategoryFromAnotherUserResponse = await request(
            app.getHttpServer(),
          )
            .post("/transactions/expenses")
            .set("Cookie", getSessionCookie(session.entity))
            .query(queryInput)
            .send({
              ...uniqueTransactionInput,
              ...overrideBodyInput,
              bankAccountId: bankAccount.entity.id.value,
              categoryName: transactionCategoryFromAnotherUser.entity.name,
            } satisfies TransactionDebitExpenseSchemaToCreateUnique);

          expect(transactionCategoryFromAnotherUserResponse.statusCode).toEqual(
            201,
          );

          const transactionWithCategoryWithSameNameFromAnotherUserOnDatabase =
            await transactionDebitExpenseFactory.getLastCreatedWithCategory();

          expect(
            transactionWithCategoryWithSameNameFromAnotherUserOnDatabase.transactionCategoryId,
          ).not.toEqual(transactionCategoryFromAnotherUser.entity.id.value);
          expect(
            transactionWithCategoryWithSameNameFromAnotherUserOnDatabase,
          ).toMatchObject({
            categoryName: transactionCategoryFromAnotherUser.entity.name,
            transactionType: "EXPENSE",
          });
        },
      );

      it.each(casesForEachRecurrence)(
        "should not be able to associate existing transaction category if it is not expense (recurrence: $queryInput.recurrence)",
        async ({ queryInput, overrideBodyInput }) => {
          const earningTransactionCategory =
            await transactionCategoryFactory.makeAndSaveUnique({
              userId: user.entity.id.value,
              transactionType: "EARNING",
            });

          const response = await request(app.getHttpServer())
            .post("/transactions/expenses")
            .set("Cookie", getSessionCookie(session.entity))
            .query(queryInput)
            .send({
              ...uniqueTransactionInput,
              ...overrideBodyInput,
              bankAccountId: bankAccount.entity.id.value,
              categoryName: earningTransactionCategory.entity.name,
            } satisfies TransactionDebitExpenseSchemaToCreateUnique);

          expect(response.statusCode).toEqual(201);

          const transactionOnDatabase =
            await transactionDebitExpenseFactory.getLastCreatedWithCategory();

          expect(transactionOnDatabase.transactionCategoryId).not.toEqual(
            earningTransactionCategory.entity.id.value,
          );
          expect(transactionOnDatabase).toMatchObject({
            categoryName: earningTransactionCategory.entity.name,
            transactionType: "EXPENSE",
          });
        },
      );
    });
  });

  describe("unique transaction", () => {
    const uniqueTransactionQueryInput = {
      recurrence: undefined,
    } satisfies CreateTransactionDebitExpenseControllerQuery;

    beforeAll(async () => {
      await drizzle.client.execute(sql`
        DELETE FROM transactions;
        DELETE FROM transaction_recurrences;
      `);
    });

    it("should be able to create a unique debit expense transaction", async () => {
      const input = {
        ...uniqueTransactionInput,
        bankAccountId: bankAccount.entity.id.value,
      } satisfies TransactionDebitExpenseSchemaToCreateUnique;

      const response = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .query(uniqueTransactionQueryInput)
        .send(input);

      expect(response.statusCode).toEqual(201);

      const transactionRecurrencesOnDatabase =
        await drizzle.executeToGet<DrizzleTransactionRecurrenceData>(sql`
          SELECT
            *
          FROM
            transaction_recurrences
      `);

      expect(transactionRecurrencesOnDatabase).toHaveLength(0);

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
      `);

      expect(transactionDebitExpensesOnDatabase).toHaveLength(1);

      const [transactionDebitExpenseOnDatabase] =
        transactionDebitExpensesOnDatabase;

      expect(transactionDebitExpenseOnDatabase).toBeTruthy();

      const {
        categoryName, // eslint-disable-line @typescript-eslint/no-unused-vars
        isAccomplished, // eslint-disable-line @typescript-eslint/no-unused-vars
        ...inputCorrespondingToDatabaseData
      } = input;

      expect(transactionDebitExpenseOnDatabase).toMatchObject(
        inputCorrespondingToDatabaseData,
      );
      expect(transactionDebitExpenseOnDatabase.type).toEqual("DEBIT_EXPENSE");
      expect(transactionDebitExpenseOnDatabase.accomplishedAt).toBeNull();
    });
  });

  describe("installment transaction", () => {
    const installmentTransactionQueryInput = {
      recurrence: "INSTALLMENT",
    } satisfies CreateTransactionDebitExpenseControllerQuery;

    beforeAll(async () => {
      await drizzle.client.execute(sql`
        DELETE FROM transactions;
        DELETE FROM transaction_recurrences;
      `);
    });

    const casesForEachPeriod = [
      {
        period: "YEAR" as const,
        getExpectedTransactedDateFromEachTransaction: (
          inputTransactedDate: Date,
          index: number,
        ) => {
          const expectedDate = new Date(inputTransactedDate.getTime());

          expectedDate.setFullYear(inputTransactedDate.getFullYear() + index);

          return expectedDate.getTime();
        },
      },
      {
        period: "MONTH" as const,
        getExpectedTransactedDateFromEachTransaction: (
          inputTransactedDate: Date,
          index: number,
        ) => {
          const expectedDate = new Date(inputTransactedDate.getTime());

          expectedDate.setMonth(inputTransactedDate.getMonth() + index);

          return expectedDate.getTime();
        },
      },
      {
        period: "WEEK" as const,
        getExpectedTransactedDateFromEachTransaction: (
          inputTransactedDate: Date,
          index: number,
        ) => {
          const expectedDate = new Date(inputTransactedDate.getTime());

          expectedDate.setDate(inputTransactedDate.getDate() + 7 * index);

          return expectedDate.getTime();
        },
      },
    ];

    it.each(casesForEachPeriod)(
      "should be able to create a installment debit expense transaction (period: $period)",
      async ({ period, getExpectedTransactedDateFromEachTransaction }) => {
        const input = {
          ...uniqueTransactionInput,
          bankAccountId: bankAccount.entity.id.value,
          installmentPeriod: period,
          installmentNumber: 10,
        } satisfies TransactionDebitExpenseSchemaToCreateInstallment;

        const response = await request(app.getHttpServer())
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(installmentTransactionQueryInput)
          .send(input);

        expect(response.statusCode).toEqual(201);

        const transactionRecurrencesOnDatabase =
          await drizzle.executeToGet<DrizzleTransactionRecurrenceData>(sql`
            SELECT
              *
            FROM
              transaction_recurrences
            WHERE
              period = ${period}
        `);

        expect(transactionRecurrencesOnDatabase).toHaveLength(1);

        const [transactionRecurrenceOnDatabase] =
          transactionRecurrencesOnDatabase;

        expect(transactionRecurrenceOnDatabase).toStrictEqual({
          id: expect.any(String),
          period: input.installmentPeriod,
          installments: input.installmentNumber,
          interval: null,
          occurrences: null,
          type: "INSTALLMENT",
        });

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
            transactions.transaction_recurrence_id = ${transactionRecurrenceOnDatabase.id}
      `);

        expect(transactionDebitExpensesOnDatabase).toHaveLength(
          input.installmentNumber,
        );

        const {
          categoryName, // eslint-disable-line @typescript-eslint/no-unused-vars
          isAccomplished, // eslint-disable-line @typescript-eslint/no-unused-vars
          installmentNumber, // eslint-disable-line @typescript-eslint/no-unused-vars
          installmentPeriod, // eslint-disable-line @typescript-eslint/no-unused-vars
          transactedAt, // eslint-disable-line @typescript-eslint/no-unused-vars
          ...inputCorrespondingToDatabaseData
        } = input;

        for (
          let index = 0;
          index < transactionDebitExpensesOnDatabase.length;
          index++
        ) {
          const transactionDebitExpenseOnDatabase =
            transactionDebitExpensesOnDatabase[index];

          expect(transactionDebitExpenseOnDatabase).toBeTruthy();
          expect(transactionDebitExpenseOnDatabase).toMatchObject(
            inputCorrespondingToDatabaseData,
          );
          expect(transactionDebitExpenseOnDatabase.type).toEqual(
            "DEBIT_EXPENSE",
          );
          expect(transactionDebitExpenseOnDatabase.accomplishedAt).toBeNull();
          expect(
            transactionDebitExpenseOnDatabase.transactionRecurrenceId,
          ).toEqual(transactionRecurrenceOnDatabase.id);

          const expectedTransactedDate =
            getExpectedTransactedDateFromEachTransaction(
              input.transactedAt,
              index,
            );

          expect(
            transactionDebitExpenseOnDatabase.transactedAt.getTime(),
          ).toEqual(expectedTransactedDate);
        }
      },
    );

    describe("input data validations", () => {
      it("with missing installment fields", async () => {
        const installmentNumberMissingResponse = await request(
          app.getHttpServer(),
        )
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(installmentTransactionQueryInput)
          .send({
            ...uniqueTransactionInput,
            installmentPeriod: "YEAR",
            // @ts-expect-error field "installmentNumber" is required
          } satisfies TransactionDebitExpenseSchemaToCreateInstallment);

        expect(installmentNumberMissingResponse.statusCode).toEqual(400);
        expect(installmentNumberMissingResponse.body.error).toEqual(
          "ValidationError",
        );
        expect(
          Object.keys(installmentNumberMissingResponse.body.debug),
        ).toEqual(["installmentNumber"]);

        const installmentPeriodMissingResponse = await request(
          app.getHttpServer(),
        )
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(installmentTransactionQueryInput)
          .send({
            ...uniqueTransactionInput,
            installmentNumber: 1,
            // @ts-expect-error field "installmentPeriod" is required
          } satisfies TransactionDebitExpenseSchemaToCreateInstallment);

        expect(installmentPeriodMissingResponse.statusCode).toEqual(400);
        expect(installmentPeriodMissingResponse.body.error).toEqual(
          "ValidationError",
        );
        expect(
          Object.keys(installmentPeriodMissingResponse.body.debug),
        ).toEqual(["installmentPeriod"]);
      });

      it("with invalid installment period", async () => {
        const response = await request(app.getHttpServer())
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(installmentTransactionQueryInput)
          .send({
            ...uniqueTransactionInput,
            // @ts-expect-error value "DAY" is not allowed
            installmentPeriod: "DAY",
            installmentNumber: 1,
          } satisfies TransactionDebitExpenseSchemaToCreateInstallment);

        expect(response.statusCode).toEqual(400);
        expect(response.body.error).toEqual("ValidationError");
        expect(Object.keys(response.body.debug)).toEqual(["installmentPeriod"]);
      });

      it("with invalid installment number", async () => {
        const negativeNumberResponse = await request(app.getHttpServer())
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(installmentTransactionQueryInput)
          .send({
            ...uniqueTransactionInput,
            installmentPeriod: "MONTH",
            installmentNumber: -1,
          } satisfies TransactionDebitExpenseSchemaToCreateInstallment);

        expect(negativeNumberResponse.statusCode).toEqual(400);
        expect(negativeNumberResponse.body.error).toEqual("ValidationError");
        expect(Object.keys(negativeNumberResponse.body.debug)).toEqual([
          "installmentNumber",
        ]);

        const decimalNumberResponse = await request(app.getHttpServer())
          .post("/transactions/expenses")
          .set("Cookie", getSessionCookie(session.entity))
          .query(installmentTransactionQueryInput)
          .send({
            ...uniqueTransactionInput,
            installmentPeriod: "MONTH",
            installmentNumber: 0.7,
          } satisfies TransactionDebitExpenseSchemaToCreateInstallment);

        expect(decimalNumberResponse.statusCode).toEqual(400);
        expect(decimalNumberResponse.body.error).toEqual("ValidationError");
        expect(Object.keys(decimalNumberResponse.body.debug)).toEqual([
          "installmentNumber",
        ]);
      });
    });
  });
});
