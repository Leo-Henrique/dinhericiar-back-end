import { Slug } from "@/domain/entities/value-objects/slug";
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
import {
  BankAccountFactory,
  BankAccountFactoryMakeAndSaveOutput,
} from "test/factories/bank-account.factory";
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
import { UpdateBankAccountControllerBody } from "./update-bank-account.controller";

describe("[Controller] PUT /bank-accounts/:id", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;

  let user: UserFactoryMakeAndSaveOutput;
  let anotherUser: UserFactoryMakeAndSaveOutput;
  let session: SessionFactoryMakeAndSaveOutput;
  let sessionFromAnotherUser: SessionFactoryMakeAndSaveOutput;
  let bankAccount: BankAccountFactoryMakeAndSaveOutput;
  let bankAccountFromAnotherUser: BankAccountFactoryMakeAndSaveOutput;

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

    [bankAccount, bankAccountFromAnotherUser] =
      await drizzle.client.transaction(session => {
        return Promise.all([
          bankAccountFactory.makeAndSave(
            { userId: user.entity.id.value },
            { session },
          ),
          bankAccountFactory.makeAndSave(
            { userId: anotherUser.entity.id.value },
            { session },
          ),
        ]);
      });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to update a bank account", async () => {
    const input = {
      institution: faker.company.name(),
      name: faker.lorem.sentence(),
      balance: faker.number.float({ fractionDigits: 2 }),
    } satisfies UpdateBankAccountControllerBody;

    const response = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(response.statusCode).toEqual(204);

    const [bankAccountOnDatabase] =
      await drizzle.executeToGet<DrizzleBankAccountData>(sql`
        SELECT
          *
        FROM 
          bank_accounts
        WHERE
          user_id = ${user.entity.id.value}     
    `);

    expect(bankAccountOnDatabase).toBeTruthy();
    expect(bankAccountOnDatabase).toMatchObject(input);
    expect(bankAccountOnDatabase.slug).toEqual(
      Slug.createFromText(input.name).value,
    );

    const responseWithSameValues = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(responseWithSameValues.statusCode).toEqual(204);
  });

  it("should not be able to update a bank account as the main one if the user already has one", async () => {
    const userMainBankAccount = await bankAccountFactory.makeAndSave({
      userId: user.entity.id.value,
      isMainAccount: true,
    });

    const response = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        isMainAccount: true,
      } satisfies UpdateBankAccountControllerBody);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseByTheSameBankAccount = await request(app.getHttpServer())
      .put(`/bank-accounts/${userMainBankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        isMainAccount: true,
      } satisfies UpdateBankAccountControllerBody);

    expect(responseByTheSameBankAccount.statusCode).toEqual(204);

    const responseFromAnotherUser = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccountFromAnotherUser.entity.id.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send({
        isMainAccount: true,
      } satisfies UpdateBankAccountControllerBody);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to update a bank account with an name already registered by the same user", async () => {
    const anotherBankAccount = await bankAccountFactory.makeAndSave({
      userId: user.entity.id.value,
    });

    const response = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        name: anotherBankAccount.entity.name.value,
      } satisfies UpdateBankAccountControllerBody);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseByTheSameBankAccount = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        name: bankAccount.entity.name.value,
      } satisfies UpdateBankAccountControllerBody);

    expect(responseByTheSameBankAccount.statusCode).toEqual(204);

    const responseFromAnotherUser = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccountFromAnotherUser.entity.id.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send({
        name: bankAccount.entity.name.value,
      } satisfies UpdateBankAccountControllerBody);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to update a bank account with an institution name already registered by the same user", async () => {
    const anotherBankAccount = await bankAccountFactory.makeAndSave({
      userId: user.entity.id.value,
    });

    const response = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        institution: anotherBankAccount.entity.institution.value,
      } satisfies UpdateBankAccountControllerBody);

    expect(response.statusCode).toEqual(409);
    expect(response.body.error).toEqual("ResourceAlreadyExistsError");

    const responseByTheSameBankAccount = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send({
        institution: bankAccount.entity.institution.value,
      } satisfies UpdateBankAccountControllerBody);

    expect(responseByTheSameBankAccount.statusCode).toEqual(204);

    const responseFromAnotherUser = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccountFromAnotherUser.entity.id.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send({
        institution: bankAccount.entity.institution.value,
      } satisfies UpdateBankAccountControllerBody);

    expect(responseFromAnotherUser.statusCode).toEqual(204);
  });

  it("should not be able to update a non-existing bank account from user", async () => {
    const input = {
      name: faker.lorem.sentence(),
    } satisfies UpdateBankAccountControllerBody;

    const response = await request(app.getHttpServer())
      .put(`/bank-accounts/${faker.string.uuid()}`)
      .set("Cookie", getSessionCookie(session.entity))
      .send(input);

    expect(response.statusCode).toEqual(400);
    expect(response.body.error).toEqual("ResourceNotFoundError");

    const responseFromAnotherUser = await request(app.getHttpServer())
      .put(`/bank-accounts/${bankAccount.entity.id.value}`)
      .set("Cookie", getSessionCookie(sessionFromAnotherUser.entity))
      .send(input);

    expect(responseFromAnotherUser.statusCode).toEqual(400);
    expect(responseFromAnotherUser.body.error).toEqual("ResourceNotFoundError");
  });

  describe("Input data validations", () => {
    it("should not be able to update a bank account without any new field", async () => {
      const response = await request(app.getHttpServer())
        .put(`/bank-accounts/${bankAccount.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({} satisfies UpdateBankAccountControllerBody);

      expect(response.statusCode).toStrictEqual(400);
      expect(response.body.error).toStrictEqual("ValidationError");
    });

    it("should not be able to update a bank account with invalid balance", async () => {
      const response = await request(app.getHttpServer())
        .put(`/bank-accounts/${bankAccount.entity.id.value}`)
        .set("Cookie", getSessionCookie(session.entity))
        .send({
          balance: -1,
        } satisfies UpdateBankAccountControllerBody);

      expect(response.statusCode).toStrictEqual(400);
      expect(response.body.error).toStrictEqual("ValidationError");
    });
  });
});
