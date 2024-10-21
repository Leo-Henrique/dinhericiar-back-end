import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";
import {
  BankAccountFactory,
  BankAccountFactoryInput,
  BankAccountFactoryOutput,
} from "test/factories/bank-account.factory";
import {
  SessionFactory,
  SessionFactoryOutput,
} from "test/factories/session.factory";
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ListBankAccountsControllerQuery } from "./list-bank-accounts.controller";

describe("[Controller] GET /bank-accounts", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;
  let bankAccountFactory: BankAccountFactory;

  let user: UserFactoryOutput;
  let anotherUser: UserFactoryOutput;
  let session: SessionFactoryOutput;
  let bankAccounts: BankAccountFactoryOutput[];

  const totalBankAccounts = 5 as const;

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
    session = await sessionFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });
    bankAccounts = await bankAccountFactory.makeAndSaveMany(
      Array.from({ length: totalBankAccounts }).map(
        (_, index) =>
          ({
            userId: user.entity.id.value,
            isMainAccount: index === 2,
            createdAt: new Date(Date.now() + 1000 * 60 * index),
          }) satisfies BankAccountFactoryInput,
      ),
    );
    await bankAccountFactory.makeAndSaveManyByAmount(2, {
      userId: anotherUser.entity.id.value,
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to list bank accounts", async () => {
    const response = await request(app.getHttpServer())
      .get("/bank-accounts")
      .set("Cookie", getSessionCookie(session.entity))
      .query({
        page: 1,
        itemsPerPage: totalBankAccounts,
      } satisfies ListBankAccountsControllerQuery);

    expect(response.statusCode).toEqual(200);

    const [{ totalBalance }] = await drizzle.executeToGet<{
      totalBalance: number;
    }>(sql`
      SELECT
        SUM(balance)::DECIMAL AS total_balance
      FROM
        bank_accounts
      WHERE 
        user_id = ${user.entity.id.value}   
    `);

    expect(response.body).toStrictEqual({
      bankAccounts: expect.arrayContaining(
        bankAccounts.map(bankAccount => {
          const bankAccountRawData = bankAccount.entity.getRawData();

          return {
            ...bankAccountRawData,
            createdAt: bankAccountRawData.createdAt.toISOString(),
          };
        }),
      ),
      totalBankAccounts,
      totalBalance,
    });
  });

  it("should be able to list bank accounts sorted by main account and creation date", async () => {
    const response = await request(app.getHttpServer())
      .get("/bank-accounts")
      .set("Cookie", getSessionCookie(session.entity))
      .query({
        page: 1,
        itemsPerPage: totalBankAccounts,
      } satisfies ListBankAccountsControllerQuery);

    expect(response.statusCode).toEqual(200);

    const sortedBankAccounts = bankAccounts
      .sort((a, b) => +b.entity.createdAt - +a.entity.createdAt)
      .sort((a, b) => +b.entity.isMainAccount - +a.entity.isMainAccount);

    expect(response.body.bankAccounts).toEqual(
      sortedBankAccounts.map(bankAccount => {
        const bankAccountRawData = bankAccount.entity.getRawData();

        return expect.objectContaining({
          ...bankAccountRawData,
          createdAt: bankAccountRawData.createdAt.toISOString(),
        });
      }),
    );
  });

  it("should be able to list bank accounts with pagination", async () => {
    const itemsPerPage = 3;

    const responseFromFirstPage = await request(app.getHttpServer())
      .get("/bank-accounts")
      .set("Cookie", getSessionCookie(session.entity))
      .query({
        page: 1,
        itemsPerPage,
      } satisfies ListBankAccountsControllerQuery);

    expect(responseFromFirstPage.statusCode).toEqual(200);
    expect(responseFromFirstPage.body.bankAccounts).toHaveLength(itemsPerPage);
    expect(responseFromFirstPage.body.totalBankAccounts).toEqual(
      totalBankAccounts,
    );

    const lastPage = Math.ceil(totalBankAccounts / itemsPerPage);
    const responseFromLastPage = await request(app.getHttpServer())
      .get("/bank-accounts")
      .set("Cookie", getSessionCookie(session.entity))
      .query({
        page: lastPage,
        itemsPerPage,
      } satisfies ListBankAccountsControllerQuery);

    expect(responseFromLastPage.statusCode).toEqual(200);

    const bankAccountsOnLastPage =
      totalBankAccounts - itemsPerPage * (lastPage - 1);

    expect(responseFromLastPage.body.bankAccounts).toHaveLength(
      bankAccountsOnLastPage,
    );
    expect(responseFromLastPage.body.totalBankAccounts).toEqual(
      totalBankAccounts,
    );
  });
});
