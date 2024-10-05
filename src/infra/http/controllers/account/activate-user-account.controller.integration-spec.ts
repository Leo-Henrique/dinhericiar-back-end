import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleUserActivationTokenData } from "@/infra/database/drizzle/schemas/drizzle-user-activation-token.schema";
import { DrizzleUserData } from "@/infra/database/drizzle/schemas/drizzle-user.schema";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";
import { UserActivationTokenFactory } from "test/factories/user-activation-token.factory";
import {
  UserFactory,
  UserFactoryMakeAndSaveOutput,
} from "test/factories/user.factory";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ActivateUserAccountControllerBody } from "./activate-user-account.controller";

describe("[Controller] PATCH /account/activate", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let userActivationTokenFactory: UserActivationTokenFactory;

  let user: UserFactoryMakeAndSaveOutput;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, UserActivationTokenFactory],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    userFactory = moduleRef.get(UserFactory);
    userActivationTokenFactory = moduleRef.get(UserActivationTokenFactory);

    user = await userFactory.makeAndSave();

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to activate user account", async () => {
    const userActivationToken = await userActivationTokenFactory.makeAndSave({
      userId: user.entity.id.value,
    });

    const response = await request(app.getHttpServer())
      .patch("/account/activate")
      .send({
        token: userActivationToken.entity.token.value,
      } satisfies ActivateUserAccountControllerBody);

    expect(response.statusCode).toEqual(204);

    const userOnDatabaseQuery = sql`
      SELECT
        *
      FROM
        users
      WHERE
        id = ${user.entity.id.value};
    `;
    const userActivationTokensOnDatabaseQuery = sql`
      SELECT
        *
      FROM
        user_activation_tokens
      WHERE
        user_id = ${user.entity.id.value}     
    `;

    const [[userOnDatabase], userActivationTokensOnDatabase] =
      await drizzle.client.transaction(
        async session =>
          await Promise.all([
            drizzle.executeToGet<DrizzleUserData>(userOnDatabaseQuery, {
              session,
            }),
            drizzle.executeToGet<DrizzleUserActivationTokenData>(
              userActivationTokensOnDatabaseQuery,
              { session },
            ),
          ]),
      );

    expect(userOnDatabase.activatedAt).not.toBeNull();
    expect(userOnDatabase.activatedAt?.getTime()).toBeLessThan(Date.now());
    expect(userActivationTokensOnDatabase).toHaveLength(0);
  });

  it("should not be able to activate an account with expired token", async () => {
    const anotherUser = await userFactory.makeAndSave();
    const expiredUserActivationToken =
      await userActivationTokenFactory.makeAndSave({
        userId: anotherUser.entity.id.value,
        expiresAt: new Date(),
      });

    const response = await request(app.getHttpServer())
      .patch("/account/activate")
      .send({
        token: expiredUserActivationToken.entity.token.value,
      } satisfies ActivateUserAccountControllerBody);

    expect(response.statusCode).toStrictEqual(400);
    expect(response.body.error).toStrictEqual(
      "UserActivationTokenExpiredError",
    );
  });

  it("should not be able to activate an already activated account", async () => {
    const expiredUserActivationToken =
      await userActivationTokenFactory.makeAndSave({
        userId: user.entity.id.value,
      });

    const response = await request(app.getHttpServer())
      .patch("/account/activate")
      .send({
        token: expiredUserActivationToken.entity.token.value,
      } satisfies ActivateUserAccountControllerBody);

    expect(response.statusCode).toStrictEqual(400);
    expect(response.body.error).toStrictEqual(
      "UserAccountAlreadyActivatedError",
    );
  });

  it("should not be able to activate an account from a non-existing activation token", async () => {
    const nonExistingUserActivationToken = userActivationTokenFactory.make();

    const response = await request(app.getHttpServer())
      .patch("/account/activate")
      .send({
        token: nonExistingUserActivationToken.entity.token.value,
      } satisfies ActivateUserAccountControllerBody);

    expect(response.statusCode).toStrictEqual(400);
    expect(response.body.error).toStrictEqual("BadRequestError");
  });
});
