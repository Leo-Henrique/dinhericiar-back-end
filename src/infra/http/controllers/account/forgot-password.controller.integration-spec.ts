import { UserPasswordResetTokenEntity } from "@/domain/entities/user-password-reset-token.entity";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleUserPasswordResetTokenData } from "@/infra/database/drizzle/schemas/user-password-reset-token.schema";
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
import { ForgotPasswordControllerBody } from "./forgot-password.controller";

describe("[Controller] POST /account/forgot-password", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let userFactory: UserFactory;

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

    user = await userFactory.makeAndSave();

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to send email to recovery password", async () => {
    const response = await request(app.getHttpServer())
      .post("/account/forgot-password")
      .send({
        email: user.entity.email.value,
      } satisfies ForgotPasswordControllerBody);

    expect(response.statusCode).toEqual(204);

    const userPasswordResetTokensOnDatabase =
      await drizzle.executeToGet<DrizzleUserPasswordResetTokenData>(sql`
        SELECT
          *
        FROM
          user_password_reset_tokens
        WHERE
          user_id = ${user.entity.id.value}     
    `);

    expect(userPasswordResetTokensOnDatabase).toHaveLength(1);

    const [userPasswordResetTokenOnDatabase] =
      userPasswordResetTokensOnDatabase;

    expect(userPasswordResetTokenOnDatabase).toBeTruthy();
    expect(userPasswordResetTokenOnDatabase.token).toHaveLength(
      UserPasswordResetTokenEntity.tokenBytes * 2,
    );

    const tokenApproximateExpiration = new Date(
      Date.now() +
        UserPasswordResetTokenEntity.tokenDefaultDurationInMilliseconds,
    );

    userPasswordResetTokenOnDatabase.expiresAt.setSeconds(0, 0);
    tokenApproximateExpiration.setSeconds(0, 0);

    expect(userPasswordResetTokenOnDatabase.expiresAt.getTime()).toEqual(
      tokenApproximateExpiration.getTime(),
    );
  });

  it("should not be able to send email to recovery password with a non-existing e-mail on app", async () => {
    const nonExistingUser = userFactory.make();

    const response = await request(app.getHttpServer())
      .post("/account/forgot-password")
      .send({
        email: nonExistingUser.entity.email.value,
      } satisfies ForgotPasswordControllerBody);

    expect(response.statusCode).toStrictEqual(400);
    expect(response.body.error).toStrictEqual("ResourceNotFoundError");
  });
});
