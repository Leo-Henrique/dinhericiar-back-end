import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleUserPasswordResetTokenData } from "@/infra/database/drizzle/schemas/drizzle-user-password-reset-token.schema";
import { DrizzleUserData } from "@/infra/database/drizzle/schemas/drizzle-user.schema";
import { faker } from "@faker-js/faker";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { compare } from "bcryptjs";
import { sql } from "drizzle-orm";
import request from "supertest";
import { UserPasswordResetTokenFactory } from "test/factories/user-password-reset-token.factory";
import {
  UserFactory,
  UserFactoryMakeAndSaveOutput,
} from "test/factories/user.factory";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ResetPasswordControllerBody } from "./reset-password.controller";

describe("[Controller] PATCH /account/reset-password", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;
  let userPasswordResetTokenFactory: UserPasswordResetTokenFactory;

  let user: UserFactoryMakeAndSaveOutput;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [UserFactory, UserPasswordResetTokenFactory],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    userFactory = moduleRef.get(UserFactory);
    userPasswordResetTokenFactory = moduleRef.get(
      UserPasswordResetTokenFactory,
    );

    user = await userFactory.makeAndSave();

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to reset user password", async () => {
    const userPasswordResetToken =
      await userPasswordResetTokenFactory.makeAndSave({
        userId: user.entity.id.value,
      });

    const newPassword = faker.internet.password();
    const response = await request(app.getHttpServer())
      .patch("/account/reset-password")
      .send({
        token: userPasswordResetToken.entity.token.value,
        password: newPassword,
      } satisfies ResetPasswordControllerBody);

    expect(response.statusCode).toEqual(204);

    const userOnDatabaseQuery = sql`
      SELECT
        *
      FROM
        users
      WHERE
        id = ${user.entity.id.value};
    `;
    const userPasswordResetTokensOnDatabaseQuery = sql`
      SELECT
        *
      FROM
        user_password_reset_tokens
      WHERE
        user_id = ${user.entity.id.value}     
    `;

    const [[userOnDatabase], userPasswordResetTokensOnDatabase] =
      await drizzle.client.transaction(
        async session =>
          await Promise.all([
            drizzle.executeToGet<DrizzleUserData>(userOnDatabaseQuery, {
              session,
            }),
            drizzle.executeToGet<DrizzleUserPasswordResetTokenData>(
              userPasswordResetTokensOnDatabaseQuery,
              { session },
            ),
          ]),
      );

    expect(userOnDatabase).not.toEqual(newPassword);

    const isValidPassword = await compare(newPassword, userOnDatabase.password);

    expect(isValidPassword).toBeTruthy();
    expect(userPasswordResetTokensOnDatabase).toHaveLength(0);
  });

  it("should not be able to reset user password with expired token", async () => {
    const expiredUserPasswordResetToken =
      await userPasswordResetTokenFactory.makeAndSave({
        userId: user.entity.id.value,
        expiresAt: new Date(),
      });

    const response = await request(app.getHttpServer())
      .patch("/account/reset-password")
      .send({
        token: expiredUserPasswordResetToken.entity.token.value,
        password: faker.internet.password(),
      } satisfies ResetPasswordControllerBody);

    expect(response.statusCode).toStrictEqual(400);
    expect(response.body.error).toStrictEqual(
      "UserPasswordResetTokenExpiredError",
    );
  });

  it("should not be able to reset user password from a non-existing token", async () => {
    const nonExistingUserPasswordResetToken =
      userPasswordResetTokenFactory.make();

    const response = await request(app.getHttpServer())
      .patch("/account/reset-password")
      .send({
        token: nonExistingUserPasswordResetToken.entity.token.value,
        password: faker.internet.password(),
      } satisfies ResetPasswordControllerBody);

    expect(response.statusCode).toStrictEqual(400);
    expect(response.body.error).toStrictEqual("BadRequestError");
  });
});
