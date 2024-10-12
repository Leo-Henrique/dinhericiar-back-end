import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleSessionData } from "@/infra/database/drizzle/schemas/drizzle-session.schema";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";
import {
  SessionFactory,
  SessionFactoryOutput,
} from "test/factories/session.factory";
import { UserFactory, UserFactoryOutput } from "test/factories/user.factory";
import { getSessionCookie } from "test/integration/get-session-cookie";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SESSION_COOKIE_NAME } from "../../auth/session-cookie-name";

describe("[Controller] DELETE /sessions/me", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let sessionFactory: SessionFactory;

  let user: UserFactoryOutput;
  let session: SessionFactoryOutput;

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

    user = await userFactory.makeAndSaveUnique();
    session = await sessionFactory.makeAndSaveUnique({
      userId: user.entity.id.value,
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to revoke current session", async () => {
    const response = await request(app.getHttpServer())
      .delete("/sessions/me")
      .set("Cookie", getSessionCookie(session.entity));

    expect(response.statusCode).toEqual(204);

    const [cookies] = response.headers["set-cookie"];

    expect(cookies).toStrictEqual(
      `${SESSION_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    );

    const [sessionOnDatabase] =
      await drizzle.executeToGet<DrizzleSessionData>(sql`
        SELECT
          *
        FROM
          sessions
        WHERE
          token = ${session.entity.token.value}
    `);

    expect(sessionOnDatabase).toBeTruthy();
    expect(sessionOnDatabase.expiresAt.getTime()).toBeLessThanOrEqual(
      Date.now(),
    );
  });

  it("should not be able to revoke a non-existing session", async () => {
    const nonExistingSession = sessionFactory.make();

    const response = await request(app.getHttpServer())
      .delete("/sessions/me")
      .set("Cookie", getSessionCookie(nonExistingSession.entity));

    expect(response.statusCode).toStrictEqual(401);
    expect(response.body.error).toStrictEqual("SessionIsBadError");
  });
});
