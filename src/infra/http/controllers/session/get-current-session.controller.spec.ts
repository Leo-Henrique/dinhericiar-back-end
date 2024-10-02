import { SessionEntity } from "@/domain/entities/session.entity";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleSessionData } from "@/infra/database/drizzle/schemas/session.schema";
import { faker } from "@faker-js/faker";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";
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

describe("[Controller] GET /sessions/me", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;

  let user: UserFactoryMakeAndSaveOutput;
  let session: SessionFactoryMakeAndSaveOutput;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, SessionFactory],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    userFactory = moduleRef.get(UserFactory);
    sessionFactory = moduleRef.get(SessionFactory);

    user = await userFactory.makeAndSave();
    session = await sessionFactory.makeAndSave({
      userId: user.entity.id.value,
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to get current session", async () => {
    const response = await request(app.getHttpServer())
      .get("/sessions/me")
      .set("Cookie", getSessionCookie(session.entity));

    expect(response.statusCode).toEqual(200);

    const userBasePresenter = user.entity.getBasePresenter();

    expect(response.body).toStrictEqual({
      user: {
        ...userBasePresenter,
        createdAt: userBasePresenter.createdAt.toISOString(),
      },
    });
    expect(response.body.user).not.toHaveProperty("password");
  });

  it("should be able to renew current session when obtaining", async () => {
    const sessionAlmostExpiring = await sessionFactory.makeAndSave({
      userId: user.entity.id.value,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
    });

    const response = await request(app.getHttpServer())
      .get("/sessions/me")
      .set("Cookie", getSessionCookie(sessionAlmostExpiring.entity));

    expect(response.statusCode).toEqual(200);

    const [sessionOnDatabase] =
      await drizzle.executeToGet<DrizzleSessionData>(sql`
        SELECT
          *
        FROM
          sessions
        WHERE
          token = ${sessionAlmostExpiring.entity.token.value}
    `);

    expect(sessionOnDatabase).toBeTruthy();

    const sessionApproximateExpiration = new Date(
      Date.now() + SessionEntity.tokenDefaultDurationInMilliseconds,
    );

    sessionOnDatabase.expiresAt.setSeconds(0, 0);
    sessionApproximateExpiration.setSeconds(0, 0);

    expect(sessionOnDatabase.expiresAt.getTime()).toEqual(
      sessionApproximateExpiration.getTime(),
    );
  });

  it("should not be able to get an expired session", async () => {
    const expiredSession = await sessionFactory.makeAndSave({
      userId: user.entity.id.value,
      expiresAt: new Date(),
    });

    const response = await request(app.getHttpServer())
      .get("/sessions/me")
      .set("Cookie", getSessionCookie(expiredSession.entity));

    expect(response.statusCode).toStrictEqual(401);
    expect(response.body.error).toStrictEqual("SessionExpiredError");
  });

  it("should not be able to get a non-existing session", async () => {
    const nonExistingSession = sessionFactory.make();

    const response = await request(app.getHttpServer())
      .get("/sessions/me")
      .set("Cookie", getSessionCookie(nonExistingSession.entity));

    expect(response.statusCode).toStrictEqual(401);
    expect(response.body.error).toStrictEqual("SessionIsBadError");
  });

  describe("Input data validations", () => {
    it("should not be able to get a session without a cookie", async () => {
      const response = await request(app.getHttpServer()).get("/sessions/me");

      expect(response.statusCode).toStrictEqual(401);
      expect(response.body.error).toStrictEqual("SessionIsBadError");
    });

    it("should not be able get a session with invalid token", async () => {
      const invalidSessionToken = sessionFactory.make({
        token: faker.string.hexadecimal({
          length: SessionEntity.tokenBytes * 2 + 10,
          prefix: "",
        }),
      });

      const response = await request(app.getHttpServer())
        .get("/sessions/me")
        .set("Cookie", getSessionCookie(invalidSessionToken.entity));

      expect(response.statusCode).toStrictEqual(401);
      expect(response.body.error).toStrictEqual("SessionIsBadError");
    });
  });
});
