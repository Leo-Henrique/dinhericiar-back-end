import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
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
  CreditCardFactoryInput,
  CreditCardFactoryOutput,
} from "test/factories/credit-card.factory";
import {
  SessionFactory,
  SessionFactoryOutput,
} from "test/factories/session.factory";
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ListCreditCardsControllerQuery } from "./list-credit-cards.controller";

describe("[Controller] GET /credit-cards", () => {
  let app: NestFastifyApplication;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;
  let creditCardFactory: CreditCardFactory;

  let user: UserFactoryOutput;
  let anotherUser: UserFactoryOutput;
  let session: SessionFactoryOutput;
  let bankAccount: BankAccountFactoryOutput;
  let bankAccountFromAnotherUser: BankAccountFactoryOutput;
  let creditCards: CreditCardFactoryOutput[];

  const totalCreditCards = 5 as const;

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
    session = await sessionFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });
    [bankAccount, bankAccountFromAnotherUser] =
      await bankAccountFactory.makeAndSaveMany([
        { userId: user.entity.id.value },
        { userId: anotherUser.entity.id.value },
      ]);
    creditCards = await creditCardFactory.makeAndSaveMany(
      Array.from({ length: totalCreditCards }).map(
        (_, index) =>
          ({
            bankAccountId: bankAccount.entity.id.value,
            isMainCard: index === 2,
            createdAt: new Date(Date.now() + 1000 * 60 * index),
          }) satisfies CreditCardFactoryInput,
      ),
    );
    await creditCardFactory.makeAndSaveManyByAmount(2, {
      bankAccountId: bankAccountFromAnotherUser.entity.id.value,
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to list credit cards", async () => {
    const response = await request(app.getHttpServer())
      .get("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .query({
        page: 1,
        itemsPerPage: totalCreditCards,
      } satisfies ListCreditCardsControllerQuery);

    expect(response.statusCode).toEqual(200);
    expect(response.body).toStrictEqual({
      creditCards: expect.arrayContaining(
        creditCards.map(creditCard => {
          const creditCardRawData = creditCard.entity.getRawData();

          return {
            ...creditCardRawData,
            createdAt: creditCardRawData.createdAt.toISOString(),
          };
        }),
      ),
      totalCreditCards,
    });
  });

  it("should be able to list credit cards sorted by main account and creation date", async () => {
    const response = await request(app.getHttpServer())
      .get("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .query({
        page: 1,
        itemsPerPage: totalCreditCards,
      } satisfies ListCreditCardsControllerQuery);

    expect(response.statusCode).toEqual(200);

    const sortedCreditCards = creditCards
      .sort((a, b) => +b.entity.createdAt - +a.entity.createdAt)
      .sort((a, b) => +b.entity.isMainCard - +a.entity.isMainCard);

    expect(response.body.creditCards).toEqual(
      sortedCreditCards.map(creditCard => {
        const creditCardRawData = creditCard.entity.getRawData();

        return expect.objectContaining({
          ...creditCardRawData,
          createdAt: creditCardRawData.createdAt.toISOString(),
        });
      }),
    );
  });

  it("should be able to list credit cards with pagination", async () => {
    const itemsPerPage = 3;

    const responseFromFirstPage = await request(app.getHttpServer())
      .get("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .query({
        page: 1,
        itemsPerPage,
      } satisfies ListCreditCardsControllerQuery);

    expect(responseFromFirstPage.statusCode).toEqual(200);
    expect(responseFromFirstPage.body.creditCards).toHaveLength(itemsPerPage);
    expect(responseFromFirstPage.body.totalCreditCards).toEqual(
      totalCreditCards,
    );

    const lastPage = Math.ceil(totalCreditCards / itemsPerPage);
    const responseFromLastPage = await request(app.getHttpServer())
      .get("/credit-cards")
      .set("Cookie", getSessionCookie(session.entity))
      .query({
        page: lastPage,
        itemsPerPage,
      } satisfies ListCreditCardsControllerQuery);

    expect(responseFromLastPage.statusCode).toEqual(200);

    const creditCardsOnLastPage =
      totalCreditCards - itemsPerPage * (lastPage - 1);

    expect(responseFromLastPage.body.creditCards).toHaveLength(
      creditCardsOnLastPage,
    );
    expect(responseFromLastPage.body.totalCreditCards).toEqual(
      totalCreditCards,
    );
  });
});
