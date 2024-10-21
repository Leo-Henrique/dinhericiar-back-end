import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { faker } from "@faker-js/faker";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
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

describe("[Controller] GET /credit-cards/:slug", () => {
  let app: NestFastifyApplication;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;
  let creditCardFactory: CreditCardFactory;

  let user: UserFactoryOutput;
  let anotherUser: UserFactoryOutput;
  let session: SessionFactoryOutput;
  let sessionFromAnotherUser: SessionFactoryOutput;
  let bankAccount: BankAccountFactoryOutput;
  let creditCard: CreditCardFactoryOutput;

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
    userFactory = moduleRef.get(UserFactory);
    sessionFactory = moduleRef.get(SessionFactory);
    bankAccountFactory = moduleRef.get(BankAccountFactory);
    creditCardFactory = moduleRef.get(CreditCardFactory);

    [user, anotherUser] = await userFactory.makeAndSaveManyByAmount(2);
    [session, sessionFromAnotherUser] = await sessionFactory.makeAndSaveMany([
      { userId: user.entity.id.value },
      { userId: anotherUser.entity.id.value },
    ]);
    bankAccount = await bankAccountFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });
    creditCard = await creditCardFactory.makeAndSaveUnique({
      bankAccountId: bankAccount.entity.id.value,
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to get a credit card by slug", async () => {
    const response = await request(app.getHttpServer())
      .get(`/credit-cards/${creditCard.entity.slug.value}`)
      .set("Cookie", getSessionCookie(session.entity));

    expect(response.statusCode).toEqual(200);

    const creditCardRawData = creditCard.entity.getRawData();

    expect(response.body).toStrictEqual({
      creditCard: {
        ...creditCardRawData,
        createdAt: creditCardRawData.createdAt.toISOString(),
      },
    });
  });

  it("should not be able to get a non-existing credit card from user", async () => {
    const response = await request(app.getHttpServer())
      .get(`/credit-cards/${faker.lorem.slug()}`)
      .set("Cookie", getSessionCookie(session.entity));

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual("ResourceNotFoundError");

    const responseFromAnotherUser = await request(app.getHttpServer())
      .get(`/credit-cards/${creditCard.entity.slug.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity));

    expect(responseFromAnotherUser.statusCode).toEqual(400);
    expect(responseFromAnotherUser.body.error).toEqual("ResourceNotFoundError");
  });
});
