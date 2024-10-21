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
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("[Controller] DELETE /credit-cards/:id", () => {
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
    bankAccount = await bankAccountFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to delete a credit card", async () => {
    const creditCard = await creditCardFactory.makeAndSaveUnique({
      bankAccountId: bankAccount.entity.id.value,
    });

    const response = await request(app.getHttpServer())
      .delete(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity));

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

    expect(creditCardsOnDatabase).toHaveLength(0);
  });

  it("should not be able to delete a non-existing credit card from user", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/credit-cards/${faker.string.uuid()}`)
      .set("Cookie", getSessionCookie(session.entity));

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual("ResourceNotFoundError");

    const creditCard = await creditCardFactory.makeAndSaveUnique({
      bankAccountId: bankAccount.entity.id.value,
    });

    const responseFromAnotherUser = await request(app.getHttpServer())
      .delete(`/credit-cards/${creditCard.entity.id.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity));

    expect(responseFromAnotherUser.statusCode).toEqual(400);
    expect(responseFromAnotherUser.body.error).toEqual("ResourceNotFoundError");
  });
});
