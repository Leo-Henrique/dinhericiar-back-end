import { PasswordHasher } from "@/domain/gateways/cryptology/password-hasher";
import { AppModule } from "@/infra/app.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleUserActivationTokenData } from "@/infra/database/drizzle/schemas/user-activation-token.schema";
import { DrizzleUserData } from "@/infra/database/drizzle/schemas/user.schema";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { sql } from "drizzle-orm";
import request from "supertest";
import { UserFactory } from "test/factories/user.factory";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RegisterUserControllerBody } from "./register-user.controller";

describe("[Controller] POST /users", () => {
  let app: NestFastifyApplication;
  let drizzle: DrizzleService;
  let passwordHasher: PasswordHasher;
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
    passwordHasher = moduleRef.get(PasswordHasher);
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

  it(`should be able to register a user`, async () => {
    const response = await request(app.getHttpServer())
      .post("/users")
      .send(input);

    expect(response.statusCode).toEqual(201);

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
  });

  it("should be able to register a user with hashed password", async () => {
    expect(userOnDatabase).not.toEqual(input.password);

    const isValidPassword = await passwordHasher.match(
      input.password,
      userOnDatabase.password,
    );

    expect(isValidPassword).toBeTruthy();
  });

  it("should not be able to register a user with an existing email", async () => {
    const response = await request(app.getHttpServer())
      .post("/users")
      .send(input);

    expect(response.statusCode).toStrictEqual(409);
    expect(response.body.error).toStrictEqual("ResourceAlreadyExistsError");
  });
});
