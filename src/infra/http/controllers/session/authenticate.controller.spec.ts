import { SessionEntity } from "@/domain/entities/session.entity";
import { UserActivationTokenEntity } from "@/domain/entities/user-activation-token.entity";
import { EmailDispatcher } from "@/domain/gateways/email-dispatcher";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleSessionData } from "@/infra/database/drizzle/schemas/session.schema";
import { DrizzleUserActivationTokenData } from "@/infra/database/drizzle/schemas/user-activation-token.schema";
import { faker } from "@faker-js/faker";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { hash } from "bcryptjs";
import { sql } from "drizzle-orm";
import request from "supertest";
import {
  UserFactory,
  UserFactoryMakeAndSaveOutput,
} from "test/factories/user.factory";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE_NAME } from "../../auth/session-cookie-name";
import { AuthenticateControllerBody } from "./authenticate.controller";

describe("[Controller] POST /sessions", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let emailDispatcher: EmailDispatcher;
  let userFactory: UserFactory;

  let user: UserFactoryMakeAndSaveOutput;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    emailDispatcher = moduleRef.get(EmailDispatcher);
    userFactory = moduleRef.get(UserFactory);

    const password = faker.internet.password();

    user = await userFactory.makeAndSave({
      password: await hash(password, 1),
      activatedAt: faker.date.recent(),
    });
    user.input.password = password;

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to authenticate user", async () => {
    const response = await request(app.getHttpServer())
      .post("/sessions")
      .send({
        email: user.entity.email.value,
        password: user.input.password,
      } satisfies AuthenticateControllerBody);

    expect(response.statusCode).toEqual(201);

    const [sessionOnDatabase] =
      await drizzle.executeToGet<DrizzleSessionData>(sql`
        SELECT
          *
        FROM
          sessions
        WHERE
          user_id = ${user.entity.id.value}
    `);

    expect(sessionOnDatabase).toBeTruthy();
    expect(sessionOnDatabase.token).toHaveLength(SessionEntity.tokenBytes * 2);

    const [cookies] = response.headers["set-cookie"];

    expect(cookies).toStrictEqual(
      `${SESSION_COOKIE_NAME}=${sessionOnDatabase.token}; Path=/; HttpOnly; SameSite=Strict`,
    );

    const sessionApproximateExpiration = new Date(
      Date.now() + SessionEntity.tokenDefaultDurationInMilliseconds,
    );

    sessionOnDatabase.expiresAt.setSeconds(0, 0);
    sessionApproximateExpiration.setSeconds(0, 0);

    expect(sessionOnDatabase.expiresAt.getTime()).toEqual(
      sessionApproximateExpiration.getTime(),
    );
  });

  it("should be able to create a new activation token when user not activated", async () => {
    const password = faker.internet.password();
    const anotherUser = await userFactory.makeAndSave({
      password: await hash(password, 1),
      activatedAt: null,
    });

    anotherUser.input.password = password;

    const emailDispatcherSenderSpy = vi.spyOn(
      emailDispatcher,
      "sendToActivationAccount",
    );

    const response = await request(app.getHttpServer())
      .post("/sessions")
      .send({
        email: anotherUser.entity.email.value,
        password: anotherUser.input.password,
      } satisfies AuthenticateControllerBody);

    expect(response.statusCode).toStrictEqual(400);
    expect(response.body.error).toStrictEqual("UserAccountNotActivatedError");
    expect(emailDispatcherSenderSpy).toHaveBeenCalledTimes(1);

    const [userActivationTokenOnDatabase] =
      await drizzle.executeToGet<DrizzleUserActivationTokenData>(sql`
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = ${anotherUser.entity.id.value}
    `);

    expect(userActivationTokenOnDatabase).toBeTruthy();

    const activationTokenApproximateExpiration = new Date(
      Date.now() + UserActivationTokenEntity.tokenDefaultDurationInMilliseconds,
    );

    userActivationTokenOnDatabase.expiresAt.setSeconds(0, 0);
    activationTokenApproximateExpiration.setSeconds(0, 0);

    expect(userActivationTokenOnDatabase.expiresAt.getTime()).toEqual(
      activationTokenApproximateExpiration.getTime(),
    );
  });

  it("should not be able to authenticate user with invalid password", async () => {
    const response = await request(app.getHttpServer())
      .post("/sessions")
      .send({
        email: user.entity.email.value,
        password: faker.internet.password(),
      } satisfies AuthenticateControllerBody);

    expect(response.statusCode).toStrictEqual(403);
    expect(response.body.error).toStrictEqual("InvalidCredentialsError");
  });

  it("should not be able to authenticate a non-existing user", async () => {
    const response = await request(app.getHttpServer())
      .post("/sessions")
      .send({
        email: faker.internet.email(),
        password: faker.internet.password(),
      } satisfies AuthenticateControllerBody);

    expect(response.statusCode).toStrictEqual(403);
    expect(response.body.error).toStrictEqual("InvalidCredentialsError");
  });
});
