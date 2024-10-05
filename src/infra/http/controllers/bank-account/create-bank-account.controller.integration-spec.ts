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
  SessionFactoryMakeAndSaveOutput,
} from "test/factories/session.factory";
import {
  UserFactory,
  UserFactoryMakeAndSaveOutput,
} from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { CreateBankAccountControllerBody } from "./create-bank-account.controller";

describe("[Controller] POST /bank-accounts", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;

  let user: UserFactoryMakeAndSaveOutput;
  let anotherUser: UserFactoryMakeAndSaveOutput;
  let session: SessionFactoryMakeAndSaveOutput;
  let sessionFromAnotherUser: SessionFactoryMakeAndSaveOutput;

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

    user = await userFactory.makeAndSave();
    anotherUser = await userFactory.makeAndSave();
    session = await sessionFactory.makeAndSave({
      userId: user.entity.id.value,
    });
    sessionFromAnotherUser = await sessionFactory.makeAndSave({
      userId: anotherUser.entity.id.value,
    });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to create a bank account", async () => {
    const bankAccount = bankAccountFactory.make();
    const input = {
      institution: bankAccount.input.institution,
      name: bankAccount.input.name,
      balance: bankAccount.input.balance,
      isMainAccount: bankAccount.entity.isMainAccount,
    } satisfies CreateBankAccountControllerBody;

    const response = await request(app.getHttpServer())
      .post("/bank-accounts")
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

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

    expect(bankAccountsOnDatabase).toHaveLength(1);

    const [bankAccountOnDatabase] = bankAccountsOnDatabase;

    expect(bankAccountOnDatabase).toBeTruthy();
    expect(bankAccountOnDatabase).toMatchObject(input);
  });

  it("should not be able to create a bank account as the main one if the user already has one", async () => {
    await bankAccountFactory.makeAndSave({
      userId: user.entity.id.value,
      isMainAccount: true,
    });

    const input = {
      institution: faker.company.name(),
      name: faker.lorem.sentence(),
      balance: faker.number.float({ fractionDigits: 2 }),
      isMainAccount: true,
    } satisfies CreateBankAccountControllerBody;

    const response = await request(app.getHttpServer())
      .post("/bank-accounts")
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseFromAnotherUser = await request(app.getHttpServer())
      .post("/bank-accounts")
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send(input);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to create a bank account with an name already registered by the same user", async () => {
    const bankAccount = await bankAccountFactory.makeAndSave({
      userId: user.entity.id.value,
    });

    const input = {
      institution: faker.company.name(),
      name: bankAccount.entity.name.value,
      balance: faker.number.float({ fractionDigits: 2 }),
      isMainAccount: false,
    } satisfies CreateBankAccountControllerBody;

    const response = await request(app.getHttpServer())
      .post("/bank-accounts")
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseFromAnotherUser = await request(app.getHttpServer())
      .post("/bank-accounts")
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send(input);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to create a bank account with an institution name already registered by the same user", async () => {
    const bankAccount = await bankAccountFactory.makeAndSave({
      userId: user.entity.id.value,
    });
    const input = {
      institution: bankAccount.entity.institution.value,
      name: faker.lorem.sentence(),
      balance: faker.number.float({ fractionDigits: 2 }),
      isMainAccount: false,
    } satisfies CreateBankAccountControllerBody;

    const response = await request(app.getHttpServer())
      .post("/bank-accounts")
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseFromAnotherUser = await request(app.getHttpServer())
      .post("/bank-accounts")
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send(input);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  describe("Input data validations", () => {
    it("should not be able to create a bank account with invalid balance", async () => {
      const response = await request(app.getHttpServer())
        .post("/bank-accounts")
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          institution: faker.company.name(),
          name: faker.lorem.sentence(),
          balance: -1,
          isMainAccount: false,
        } satisfies CreateBankAccountControllerBody);

      expect(response.statusCode).toStrictEqual(400);
      expect(response.body.error).toStrictEqual("ValidationError");
    });
  });
});
