import { Slug } from "@/domain/entities/value-objects/slug";
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
import {
  CreditCardFactory,
  CreditCardFactoryOutput,
} from "test/factories/credit-card.factory";
import {
  SessionFactory,
  SessionFactoryOutput,
} from "test/factories/session.factory";
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { UpdateCreditCardControllerBody } from "./update-credit-card.controller";

describe("[Controller] PUT /credit-cards/:id", () => {
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
  let creditCard: CreditCardFactoryOutput;
  let creditCardFromAnotherUser: CreditCardFactoryOutput;

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
    [creditCard, creditCardFromAnotherUser] =
      await creditCardFactory.makeAndSaveMany([
        { bankAccountId: bankAccount.entity.id.value },
        { bankAccountId: bankAccountFromAnotherUser.entity.id.value },
      ]);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to update a credit card", async () => {
    const anotherBankAccount = await bankAccountFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });

    const input = {
      bankAccountId: anotherBankAccount.entity.id.value,
      name: faker.lorem.sentence(),
      limit: faker.number.float({ fractionDigits: 2 }),
      invoiceClosingDay: faker.number.int({ min: 1, max: 31 }),
      invoiceDueDay: faker.number.int({ min: 1, max: 31 }),
    } satisfies UpdateCreditCardControllerBody;

    const response = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(response.statusCode).toEqual(204);

    const [creditCardOnDatabase] =
      await drizzle.executeToGet<DrizzleCreditCardData>(sql`
        SELECT
          *
        FROM 
          credit_cards
        WHERE
          id = ${creditCard.entity.id.value}
    `);

    expect(creditCardOnDatabase).toBeTruthy();
    expect(creditCardOnDatabase).toMatchObject(input);
    expect(creditCardOnDatabase.slug).toEqual(
      Slug.createFromText(input.name).value,
    );

    const responseWithSameValues = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(responseWithSameValues.statusCode).toEqual(204);
  });

  it("should not be able to update a credit card as the main one if the user already has one", async () => {
    const userMainCreditCard = await creditCardFactory.makeAndSaveUnique({
      bankAccountId: bankAccount.entity.id.value,
      isMainCard: true,
    });
    const mainCardInput = {
      isMainCard: true,
    } satisfies UpdateCreditCardControllerBody;

    const response = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(mainCardInput);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseByTheSameCreditCard = await request(app.getHttpServer())
      .put(`/credit-cards/${userMainCreditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(mainCardInput);

    expect(responseByTheSameCreditCard.statusCode).toEqual(204);

    const responseFromAnotherUser = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCardFromAnotherUser.entity.id.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send(mainCardInput);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to update a credit card with an name already registered by the same user", async () => {
    const anotherCreditCard = await creditCardFactory.makeAndSaveUnique({
      bankAccountId: bankAccount.entity.id.value,
      name: faker.lorem.sentence().toUpperCase(),
    });

    const response = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        name: anotherCreditCard.entity.name.toLowerCase(),
      } satisfies UpdateCreditCardControllerBody);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseByTheSameCreditCard = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        name: creditCard.entity.name.toUpperCase(),
      } satisfies UpdateCreditCardControllerBody);

    expect(responseByTheSameCreditCard.statusCode).toEqual(204);

    const responseFromAnotherUser = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCardFromAnotherUser.entity.id.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send({
        name: creditCard.entity.name,
      } satisfies UpdateCreditCardControllerBody);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to update a credit card with a non-existing bank account from user", async () => {
    const response = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        bankAccountId: faker.string.uuid(),
      } satisfies UpdateCreditCardControllerBody);

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual("ResourceNotFoundError");

    const bankAccountFromAnotherUserResponse = await request(
      app.getHttpServer(),
    )
      .put(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        bankAccountId: bankAccountFromAnotherUser.entity.id.value,
      } satisfies UpdateCreditCardControllerBody);

    expect(bankAccountFromAnotherUserResponse.statusCode).toEqual(400);
    expect(bankAccountFromAnotherUserResponse.body.error).toEqual(
      "ResourceNotFoundError",
    );
  });

  it("should not be able to update a non-existing credit card from user", async () => {
    const input = {
      name: faker.lorem.sentence(),
    } satisfies UpdateCreditCardControllerBody;

    const response = await request(app.getHttpServer())
      .put(`/credit-cards/${faker.string.uuid()}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual("ResourceNotFoundError");

    const creditCardFromAnotherUserResponse = await request(app.getHttpServer())
      .put(`/credit-cards/${creditCardFromAnotherUser.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(creditCardFromAnotherUserResponse.statusCode).toEqual(400);
    expect(creditCardFromAnotherUserResponse.body.error).toEqual(
      "ResourceNotFoundError",
    );
  });

  describe("Input data validations", () => {
    it("should not be able to update a credit card without any new field", async () => {
      const response = await request(app.getHttpServer())
        .put(`/credit-cards/${creditCard.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({} satisfies UpdateCreditCardControllerBody);

      expect(response.statusCode).toStrictEqual(400);
      expect(response.body.error).toStrictEqual("ValidationError");
    });

    it("should not be able to create a credit card with invalid limit", async () => {
      const response = await request(app.getHttpServer())
        .put(`/credit-cards/${creditCard.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          limit: -1,
        } satisfies UpdateCreditCardControllerBody);

      expect(response.statusCode).toStrictEqual(400);
      expect(response.body.error).toStrictEqual("ValidationError");
    });

    it("should not be able to create a credit card with invalid closing day", async () => {
      const negativeClosingDayResponse = await request(app.getHttpServer())
        .put(`/credit-cards/${creditCard.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          invoiceClosingDay: -1,
        } satisfies UpdateCreditCardControllerBody);

      expect(negativeClosingDayResponse.statusCode).toStrictEqual(400);
      expect(negativeClosingDayResponse.body.error).toStrictEqual(
        "ValidationError",
      );

      const nonIntegerClosingDayResponse = await request(app.getHttpServer())
        .put(`/credit-cards/${creditCard.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          invoiceClosingDay: 1.2,
        } satisfies UpdateCreditCardControllerBody);

      expect(nonIntegerClosingDayResponse.statusCode).toStrictEqual(400);
      expect(nonIntegerClosingDayResponse.body.error).toStrictEqual(
        "ValidationError",
      );

      const invalidDayResponse = await request(app.getHttpServer())
        .put(`/credit-cards/${creditCard.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          invoiceClosingDay: 32,
        } satisfies UpdateCreditCardControllerBody);

      expect(invalidDayResponse.statusCode).toStrictEqual(400);
      expect(invalidDayResponse.body.error).toStrictEqual("ValidationError");
    });

    it("should not be able to create a credit card with invalid due day", async () => {
      const negativeDueDayResponse = await request(app.getHttpServer())
        .put(`/credit-cards/${creditCard.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          invoiceDueDay: -1,
        } satisfies UpdateCreditCardControllerBody);

      expect(negativeDueDayResponse.statusCode).toStrictEqual(400);
      expect(negativeDueDayResponse.body.error).toStrictEqual(
        "ValidationError",
      );

      const nonIntegerDueDayResponse = await request(app.getHttpServer())
        .put(`/credit-cards/${creditCard.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          invoiceDueDay: 1.2,
        } satisfies UpdateCreditCardControllerBody);

      expect(nonIntegerDueDayResponse.statusCode).toStrictEqual(400);
      expect(nonIntegerDueDayResponse.body.error).toStrictEqual(
        "ValidationError",
      );

      const invalidDayResponse = await request(app.getHttpServer())
        .put(`/credit-cards/${creditCard.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          invoiceDueDay: 32,
        } satisfies UpdateCreditCardControllerBody);

      expect(invalidDayResponse.statusCode).toStrictEqual(400);
      expect(invalidDayResponse.body.error).toStrictEqual("ValidationError");
    });
  });
});
