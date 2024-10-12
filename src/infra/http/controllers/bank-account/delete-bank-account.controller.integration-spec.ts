import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleBankAccountData } from "@/infra/database/drizzle/schemas/drizzle-bank-account.schema";
import { faker } from "@faker-js/faker";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";
import { BankAccountFactory } from "test/factories/bank-account.factory";
import {
  SessionFactory,
  SessionFactoryOutput,
} from "test/factories/session.factory";
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

describe("[Controller] DELETE /bank-accounts/:id", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;

  let user: UserFactoryOutput;
  let anotherUser: UserFactoryOutput;
  let session: SessionFactoryOutput;
  let sessionFromAnotherUser: SessionFactoryOutput;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, SessionFactory, BankAccountFactory],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    userFactory = moduleRef.get(UserFactory);
    sessionFactory = moduleRef.get(SessionFactory);
    bankAccountFactory = moduleRef.get(BankAccountFactory);

    [user, anotherUser] = await userFactory.makeAndSaveManyByAmount(2);
    [session, sessionFromAnotherUser] = await sessionFactory.makeAndSaveMany([
      { userId: user.entity.id.value },
      { userId: anotherUser.entity.id.value },
    ]);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to delete a bank account", async () => {
    const bankAccount = await bankAccountFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });

    const response = await request(app.getHttpServer())
      .delete(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity));

    expect(response.statusCode).toEqual(204);

    const bankAccountsOnDatabase =
      await drizzle.executeToGet<DrizzleBankAccountData>(sql`
        SELECT
          *
        FROM 
          bank_accounts
        WHERE
          user_id = ${user.entity.id.value}     
    `);

    expect(bankAccountsOnDatabase).toHaveLength(0);
  });

  it("should not be able to delete a non-existing bank account from user", async () => {
    const response = await request(app.getHttpServer())
      .delete(`/bank-accounts/${faker.string.uuid()}`)
      .set("Cookie", getSessionCookie(session.entity));

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual("ResourceNotFoundError");

    const bankAccount = await bankAccountFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });

    const responseFromAnotherUser = await request(app.getHttpServer())
      .delete(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity));

    expect(responseFromAnotherUser.statusCode).toEqual(400);
    expect(responseFromAnotherUser.body.error).toEqual("ResourceNotFoundError");
  });
});
