import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleCreditCardData } from "@/infra/database/drizzle/schemas/drizzle-credit-card.schema";
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
import { CreditCardFactory } from "test/factories/credit-card.factory";
import {
  SessionFactory,
  SessionFactoryOutput,
} from "test/factories/session.factory";
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CreateCreditCardControllerBody } from "./create-credit-card.controller";

describe("[Controller] POST /credit-cards", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;
  let creditCardFactory: CreditCardFactory;

  let user: UserFactoryOutput;
  let anotherUser: UserFactoryOutput;
  let session: SessionFactoryOutput;
  let sessionFromAnotherUser: SessionFactoryOutput;
  let bankAccount: BankAccountFactoryOutput;
  let bankAccountFromAnotherUser: BankAccountFactoryOutput;
  let input: CreateCreditCardControllerBody;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        UserFactory,
        SessionFactory,
        BankAccountFactory,
        CreditCardFactory,
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    userFactory = moduleRef.get(UserFactory);
    sessionFactory = moduleRef.get(SessionFactory);
    bankAccountFactory = moduleRef.get(BankAccountFactory);
    creditCardFactory = moduleRef.get(CreditCardFactory);

    [user, anotherUser] = await userFactory.makeAndSaveManyByAmount(2);
    [session, sessionFromAnotherUser] = await sessionFactory.makeAndSaveMany([
      { userId: user.entity.id.value },
      { userId: anotherUser.entity.id.value },
    ]);
    [bankAccount, bankAccountFromAnotherUser] =
      await bankAccountFactory.makeAndSaveMany([
        { userId: user.entity.id.value },
        { userId: anotherUser.entity.id.value },
      ]);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(() => {
    input = {
      bankAccountId: faker.string.uuid(),
      name: faker.lorem.sentence(),
      limit: faker.number.float({ fractionDigits: 2 }),
      invoiceClosingDay: faker.number.int({ min: 1, max: 31 }),
      invoiceDueDay: faker.number.int({ min: 1, max: 31 }),
      isMainCard: false,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to create a credit card", async () => {
    const validInput = {
      ...input,
      bankAccountId: bankAccount.entity.id.value,
    } satisfies CreateCreditCardControllerBody;

    const response = await request(app.getHttpServer())
      .post("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .send(validInput);

    expect(response.statusCode).toEqual(204);

    const creditCardsOnDatabase =
      await drizzle.executeToGet<DrizzleCreditCardData>(sql`
        SELECT
          credit_cards.*
        FROM 
          credit_cards
        INNER JOIN
          bank_accounts 
        ON 
          bank_accounts.id = credit_cards.bank_account_id
        AND
          bank_accounts.user_id = ${user.entity.id.value}
    `);

    expect(creditCardsOnDatabase).toHaveLength(1);

    const [creditCardOnDatabase] = creditCardsOnDatabase;

    expect(creditCardOnDatabase).toBeTruthy();
    expect(creditCardOnDatabase).toMatchObject(validInput);
  });

  it("should not be able to create a credit card as the main one if the user already has one", async () => {
    await creditCardFactory.makeAndSaveUnique({
      bankAccountId: bankAccount.entity.id.value,
      isMainCard: true,
    });

    const response = await request(app.getHttpServer())
      .post("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        ...input,
        bankAccountId: bankAccount.entity.id.value,
        isMainCard: true,
      } satisfies CreateCreditCardControllerBody);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseFromAnotherUser = await request(app.getHttpServer())
      .post("/credit-cards")
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send({
        ...input,
        bankAccountId: bankAccountFromAnotherUser.entity.id.value,
        isMainCard: true,
      } satisfies CreateCreditCardControllerBody);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to create a credit card with an name already registered by the same user", async () => {
    const creditCard = await creditCardFactory.makeAndSaveUnique({
      bankAccountId: bankAccount.entity.id.value,
      name: faker.lorem.sentence().toUpperCase(),
    });

    const response = await request(app.getHttpServer())
      .post("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        ...input,
        bankAccountId: bankAccount.entity.id.value,
        name: creditCard.entity.name.toLowerCase(),
      } satisfies CreateCreditCardControllerBody);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseFromAnotherUser = await request(app.getHttpServer())
      .post("/credit-cards")
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send({
        ...input,
        bankAccountId: bankAccountFromAnotherUser.entity.id.value,
        name: creditCard.entity.name,
      } satisfies CreateCreditCardControllerBody);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to create a credit card with a non-existing bank account from user", async () => {
    const response = await request(app.getHttpServer())
      .post("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        ...input,
        bankAccountId: faker.string.uuid(),
      } satisfies CreateCreditCardControllerBody);

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual("ResourceNotFoundError");

    const bankAccountFromAnotherUserResponse = await request(
      app.getHttpServer(),
    )
      .post("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        ...input,
        bankAccountId: bankAccountFromAnotherUser.entity.id.value,
      } satisfies CreateCreditCardControllerBody);

    expect(bankAccountFromAnotherUserResponse.statusCode).toEqual(400);
    expect(bankAccountFromAnotherUserResponse.body.error).toEqual(
      "ResourceNotFoundError",
    );
  });

  describe("Input data validations", () => {
    it("should not be able to create a credit card with invalid limit", async () => {
      const response = await request(app.getHttpServer())
        .post("/credit-cards")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          limit: -1,
        } satisfies CreateCreditCardControllerBody);

      expect(response.statusCode).toStrictEqual(400);
      expect(response.body.error).toStrictEqual("ValidationError");
    });

    it("should not be able to create a credit card with invalid closing day", async () => {
      const negativeClosingDayResponse = await request(app.getHttpServer())
        .post("/credit-cards")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          invoiceClosingDay: -1,
        } satisfies CreateCreditCardControllerBody);

      expect(negativeClosingDayResponse.statusCode).toStrictEqual(400);
      expect(negativeClosingDayResponse.body.error).toStrictEqual(
        "ValidationError",
      );

      const nonIntegerClosingDayResponse = await request(app.getHttpServer())
        .post("/credit-cards")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          invoiceClosingDay: 1.2,
        } satisfies CreateCreditCardControllerBody);

      expect(nonIntegerClosingDayResponse.statusCode).toStrictEqual(400);
      expect(nonIntegerClosingDayResponse.body.error).toStrictEqual(
        "ValidationError",
      );

      const invalidDayResponse = await request(app.getHttpServer())
        .post("/credit-cards")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          invoiceClosingDay: 32,
        } satisfies CreateCreditCardControllerBody);

      expect(invalidDayResponse.statusCode).toStrictEqual(400);
      expect(invalidDayResponse.body.error).toStrictEqual("ValidationError");
    });

    it("should not be able to create a credit card with invalid due day", async () => {
      const negativeDueDayResponse = await request(app.getHttpServer())
        .post("/credit-cards")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          invoiceDueDay: -1,
        } satisfies CreateCreditCardControllerBody);

      expect(negativeDueDayResponse.statusCode).toStrictEqual(400);
      expect(negativeDueDayResponse.body.error).toStrictEqual(
        "ValidationError",
      );

      const nonIntegerDueDayResponse = await request(app.getHttpServer())
        .post("/credit-cards")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          invoiceDueDay: 1.2,
        } satisfies CreateCreditCardControllerBody);

      expect(nonIntegerDueDayResponse.statusCode).toStrictEqual(400);
      expect(nonIntegerDueDayResponse.body.error).toStrictEqual(
        "ValidationError",
      );

      const invalidDayResponse = await request(app.getHttpServer())
        .post("/credit-cards")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          ...input,
          invoiceDueDay: 32,
        } satisfies CreateCreditCardControllerBody);

      expect(invalidDayResponse.statusCode).toStrictEqual(400);
      expect(invalidDayResponse.body.error).toStrictEqual("ValidationError");
    });
  });
});
