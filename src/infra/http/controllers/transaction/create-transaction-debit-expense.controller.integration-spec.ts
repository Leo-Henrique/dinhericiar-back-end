import { TransactionCategoryData } from "@/domain/entities/transaction-category.entity";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleBankAccountData } from "@/infra/database/drizzle/schemas/drizzle-bank-account.schema";
import { DrizzleTransactionCategoryData } from "@/infra/database/drizzle/schemas/drizzle-transaction-category.schema";
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
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CreateTransactionDebitExpenseControllerBody } from "./create-transaction-debit-expense.controller";

describe("[Controller] POST /transactions/expenses", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;
  let transactionCategoryFactory: TransactionCategoryFactory;

  let user: UserFactoryOutput;
  let anotherUser: UserFactoryOutput;
  let session: SessionFactoryOutput;
  let bankAccount: BankAccountFactoryOutput;
  let bankAccountFromAnotherUser: BankAccountFactoryOutput;
  let transactionCategory: TransactionCategoryFactoryOutput;
  let transactionCategoryFromAnotherUser: TransactionCategoryFactoryOutput;
  let input: CreateTransactionDebitExpenseControllerBody;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        UserFactory,
        SessionFactory,
        BankAccountFactory,
        TransactionCategoryFactory,
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

  beforeEach(() => {
    input = {
      bankAccountId: faker.string.uuid(),
      categoryName: faker.lorem.sentence(),
      transactedAt: faker.date.recent(),
      isAccomplished: false,
      description: faker.lorem.sentence(),
      amount: faker.number.float({ min: 1, fractionDigits: 2 }),
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to create a debit expense transaction", async () => {
    const validInput = {
      ...input,
      bankAccountId: bankAccount.entity.id.value,
    } satisfies CreateTransactionDebitExpenseControllerBody;

    const response = await request(app.getHttpServer())
      .post("/transactions/expenses")
      .set("Cookie", getSessionCookie(session.entity))
      .send(validInput);

    expect(response.statusCode).toEqual(201);

    const transactionsOnDatabase =
      await drizzle.executeToGet<DrizzleTransactionData>(sql`
        SELECT
          transactions.*
        FROM 
          transactions
        INNER JOIN
          bank_accounts 
        ON 
          bank_accounts.id = transactions.bank_account_id
        AND
          bank_accounts.user_id = ${user.entity.id.value}
    `);

    expect(transactionsOnDatabase).toHaveLength(1);

    const [transactionOnDatabase] = transactionsOnDatabase;

    expect(transactionOnDatabase).toBeTruthy();

    const {
      categoryName, // eslint-disable-line @typescript-eslint/no-unused-vars
      isAccomplished, // eslint-disable-line @typescript-eslint/no-unused-vars
      ...inputWithoutSpecificCreationFields
    } = validInput;

    expect(transactionOnDatabase).toMatchObject(
      inputWithoutSpecificCreationFields,
    );
    expect(transactionOnDatabase.accomplishedAt).toBeNull();
  });

  it("should be able to decrease bank account balance if it has been marked as accomplished", async () => {
    const response = await request(app.getHttpServer())
      .post("/transactions/expenses")
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        ...input,
        bankAccountId: bankAccount.entity.id.value,
        isAccomplished: true,
      } satisfies CreateTransactionDebitExpenseControllerBody);

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
      balance: bankAccount.entity.balance - input.amount,
    });

    expect(bankAccountOnDatabase.balance).toEqual(decreasedBalance);
  });

  it("should not be able to create a debit expense transaction with a non-existing bank account from user", async () => {
    const response = await request(app.getHttpServer())
      .post("/transactions/expenses")
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        ...input,
        bankAccountId: faker.string.uuid(),
      } satisfies CreateTransactionDebitExpenseControllerBody);

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual("ResourceNotFoundError");

    const bankAccountFromAnotherUserResponse = await request(
      app.getHttpServer(),
    )
      .post("/transactions/expenses")
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        ...input,
        bankAccountId: bankAccountFromAnotherUser.entity.id.value,
      } satisfies CreateTransactionDebitExpenseControllerBody);

    expect(bankAccountFromAnotherUserResponse.statusCode).toEqual(400);
    expect(bankAccountFromAnotherUserResponse.body.error).toEqual(
      "ResourceNotFoundError",
    );
  });

  describe("Transaction category", () => {
    const getLastCreatedTransactionWithCategory = async () => {
      type Row = DrizzleTransactionData & {
        categoryName: string;
        transactionType: TransactionCategoryData["transactionType"];
      };

      const [transaction] = await drizzle.executeToGet<Row>(sql`
          SELECT
            transactions.*,
            transaction_categories.name AS category_name,
            transaction_categories.transaction_type
          FROM 
            transactions
          INNER JOIN
            transaction_categories ON transaction_categories.id = transactions.transaction_category_id
          ORDER BY
            created_at DESC
          LIMIT
            1
      `);

      return transaction;
    };

    it("should be able to associate existing transaction category to transaction", async () => {
      const response = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          bankAccountId: bankAccount.entity.id.value,
          categoryName: transactionCategory.entity.name,
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(response.statusCode).toEqual(201);

      const transactionOnDatabase =
        await getLastCreatedTransactionWithCategory();

      expect(transactionOnDatabase).toMatchObject({
        transactionCategoryId: transactionCategory.entity.id.value,
        categoryName: transactionCategory.entity.name,
        transactionType: "EXPENSE",
      });
    });

    it("should be able to create a transaction category if it does not exist for the user", async () => {
      const nonExistingTransactionCategoryName = faker.lorem.sentence();
      const response = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          bankAccountId: bankAccount.entity.id.value,
          categoryName: nonExistingTransactionCategoryName,
        } satisfies CreateTransactionDebitExpenseControllerBody);

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
        await getLastCreatedTransactionWithCategory();

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
        .send({
          ...input,
          bankAccountId: bankAccount.entity.id.value,
          categoryName: transactionCategoryFromAnotherUser.entity.name,
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(transactionCategoryFromAnotherUserResponse.statusCode).toEqual(
        201,
      );

      const transactionWithCategoryWithSameNameFromAnotherUserOnDatabase =
        await getLastCreatedTransactionWithCategory();

      expect(
        transactionWithCategoryWithSameNameFromAnotherUserOnDatabase.transactionCategoryId,
      ).not.toEqual(transactionCategoryFromAnotherUser.entity.id.value);
      expect(
        transactionWithCategoryWithSameNameFromAnotherUserOnDatabase,
      ).toMatchObject({
        categoryName: transactionCategoryFromAnotherUser.entity.name,
        transactionType: "EXPENSE",
      });
    });

    it("should not be able to associate existing transaction category if it is not expense", async () => {
      const earningTransactionCategory =
        await transactionCategoryFactory.makeAndSaveUnique({
          userId: user.entity.id.value,
          transactionType: "EARNING",
        });

      const response = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          bankAccountId: bankAccount.entity.id.value,
          categoryName: earningTransactionCategory.entity.name,
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(response.statusCode).toEqual(201);

      const transactionOnDatabase =
        await getLastCreatedTransactionWithCategory();

      expect(transactionOnDatabase.transactionCategoryId).not.toEqual(
        earningTransactionCategory.entity.id.value,
      );
      expect(transactionOnDatabase).toMatchObject({
        categoryName: earningTransactionCategory.entity.name,
        transactionType: "EXPENSE",
      });
    });
  });

  describe("Input data validations", () => {
    let recurrenceInput: CreateTransactionDebitExpenseControllerBody;

    beforeEach(() => {
      recurrenceInput = {
        ...input,
        recurrencePeriod: "MONTH",
        recurrenceInterval: 1,
        recurrenceLimit: null,
        recurrenceOccurrence: [1],
      };
    });

    it("with recurrence but without all the recurrence fields", async () => {
      const response = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          recurrencePeriod: "MONTH",
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toEqual("ValidationError");
      expect(Object.keys(response.body.debug)).toEqual([
        "recurrenceInterval",
        "recurrenceLimit",
        "recurrenceOccurrence",
      ]);
    });

    it("with invalid recurrence period", async () => {
      const response = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          // @ts-expect-error the value is invalid
          recurrencePeriod: "day",
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(response.statusCode).toEqual(400);
      expect(response.body.error).toEqual("ValidationError");
      expect(Object.keys(response.body.debug)).toEqual(["recurrencePeriod"]);
    });

    it("with invalid recurrence occurrence with year period", async () => {
      const monthZeroResponse = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...recurrenceInput,
          recurrencePeriod: "YEAR",
          recurrenceOccurrence: [0],
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(monthZeroResponse.statusCode).toEqual(400);
      expect(monthZeroResponse.body.error).toEqual("ValidationError");
      expect(Object.keys(monthZeroResponse.body.debug)).toEqual([
        "recurrenceOccurrence",
      ]);

      const monthThirteenResponse = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...recurrenceInput,
          recurrencePeriod: "YEAR",
          recurrenceOccurrence: [13],
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(monthThirteenResponse.statusCode).toEqual(400);
      expect(monthThirteenResponse.body.error).toEqual("ValidationError");
      expect(Object.keys(monthZeroResponse.body.debug)).toEqual([
        "recurrenceOccurrence",
      ]);
    });

    it("with invalid recurrence occurrence with month period", async () => {
      const dayZeroResponse = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...recurrenceInput,
          recurrencePeriod: "MONTH",
          recurrenceOccurrence: [0],
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(dayZeroResponse.statusCode).toEqual(400);
      expect(dayZeroResponse.body.error).toEqual("ValidationError");
      expect(Object.keys(dayZeroResponse.body.debug)).toEqual([
        "recurrenceOccurrence",
      ]);

      const dayThirtyTwoResponse = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...recurrenceInput,
          recurrencePeriod: "MONTH",
          recurrenceOccurrence: [32],
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(dayThirtyTwoResponse.statusCode).toEqual(400);
      expect(dayThirtyTwoResponse.body.error).toEqual("ValidationError");
      expect(Object.keys(dayThirtyTwoResponse.body.debug)).toEqual([
        "recurrenceOccurrence",
      ]);
    });

    it("with invalid recurrence occurrence with week period", async () => {
      const dayWeekZeroResponse = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...recurrenceInput,
          recurrencePeriod: "WEEK",
          recurrenceOccurrence: [0],
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(dayWeekZeroResponse.statusCode).toEqual(400);
      expect(dayWeekZeroResponse.body.error).toEqual("ValidationError");
      expect(Object.keys(dayWeekZeroResponse.body.debug)).toEqual([
        "recurrenceOccurrence",
      ]);

      const dayWeekEightResponse = await request(app.getHttpServer())
        .post("/transactions/expenses")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...recurrenceInput,
          recurrencePeriod: "WEEK",
          recurrenceOccurrence: [8],
        } satisfies CreateTransactionDebitExpenseControllerBody);

      expect(dayWeekEightResponse.statusCode).toEqual(400);
      expect(dayWeekEightResponse.body.error).toEqual("ValidationError");
      expect(Object.keys(dayWeekEightResponse.body.debug)).toEqual([
        "recurrenceOccurrence",
      ]);
    });
  });
});
