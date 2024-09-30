import { UserActivationTokenEntity } from "@/domain/entities/user-activation-token.entity";
import { EmailDispatcher } from "@/domain/gateways/email-dispatcher";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleUserActivationTokenData } from "@/infra/database/drizzle/schemas/user-activation-token.schema";
import { DrizzleUserData } from "@/infra/database/drizzle/schemas/user.schema";
import { faker } from "@faker-js/faker";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { compare } from "bcryptjs";
import { sql } from "drizzle-orm";
import request from "supertest";
import { UserFactory } from "test/factories/user.factory";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { RegisterUserControllerBody } from "./register-user.controller";

describe("[Controller] POST /account", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let emailDispatcher: EmailDispatcher;
  let userFactory: UserFactory;

  let input: RegisterUserControllerBody;
  let userOnDatabase: DrizzleUserData;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    drizzle = moduleRef.get(DrizzleService);
    emailDispatcher = moduleRef.get(EmailDispatcher);
    userFactory = new UserFactory();

    const user = userFactory.make();

    input = {
      email: user.input.email,
      password: user.input.password,
      name: user.input.name,
    };

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to register a user", async () => {
    const emailDispatcherSenderSpy = vi.spyOn(
      emailDispatcher,
      "sendToActivationAccount",
    );

    const response = await request(app.getHttpServer())
      .post("/account")
      .send(input);

    expect(response.statusCode).toEqual(201);
    expect(emailDispatcherSenderSpy).toHaveBeenCalledTimes(1);

    [userOnDatabase] = await drizzle.executeToGet<DrizzleUserData>(sql`
      SELECT
        *
      FROM
        users
      WHERE
        email = ${input.email}
    `);

    expect(userOnDatabase).toBeTruthy();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...inputWithoutPassword } = input;

    expect(userOnDatabase).toEqual(
      expect.objectContaining(inputWithoutPassword),
    );

    const [userActivationTokenOnDatabase] =
      await drizzle.executeToGet<DrizzleUserActivationTokenData>(sql`
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = ${userOnDatabase.id}
    `);

    expect(userActivationTokenOnDatabase).toBeTruthy();

    const userActivationToken = UserActivationTokenEntity.create(
      userActivationTokenOnDatabase,
    );
    const activationTokenApproximateExpiration = new Date(
      Date.now() + userActivationToken.tokenDurationInMilliseconds,
    );

    userActivationTokenOnDatabase.expiresAt.setSeconds(0, 0);
    activationTokenApproximateExpiration.setSeconds(0, 0);

    expect(userActivationTokenOnDatabase.expiresAt.getTime()).toEqual(
      activationTokenApproximateExpiration.getTime(),
    );
  });

  it("should be able to register a user with hashed password", async () => {
    expect(userOnDatabase).not.toEqual(input.password);

    const isValidPassword = await compare(
      input.password,
      userOnDatabase.password,
    );

    expect(isValidPassword).toBeTruthy();
  });

  it("should not be able to register a user with an existing email", async () => {
    const response = await request(app.getHttpServer())
      .post("/account")
      .send(input);

    expect(response.statusCode).toStrictEqual(409);
    expect(response.body.error).toStrictEqual("ResourceAlreadyExistsError");
  });

  describe("Input data validations", () => {
    it("should not be able to register a user with invalid e-mail", async () => {
      const response = await request(app.getHttpServer())
        .post("/account")
        .send({
          email: faker.lorem.sentence(),
          password: faker.internet.password(),
          name: faker.person.fullName(),
        } satisfies RegisterUserControllerBody);

      expect(response.statusCode).toStrictEqual(400);
      expect(response.body.error).toStrictEqual("ValidationError");
    });

    it("should not be able to register a user with a password less than 6 characters", async () => {
      const response = await request(app.getHttpServer())
        .post("/account")
        .send({
          email: faker.internet.email(),
          password: faker.internet.password({ length: 5 }),
          name: faker.person.fullName(),
        } satisfies RegisterUserControllerBody);

      expect(response.statusCode).toStrictEqual(400);
      expect(response.body.error).toStrictEqual("ValidationError");
    });
  });
});
