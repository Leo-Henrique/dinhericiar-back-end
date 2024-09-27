import { SessionEntity } from "@/domain/entities/session.entity";
import { AuthenticateUseCase } from "@/domain/use-cases/session/authenticate.use-case";
import { env } from "@/infra/env";
import { Body, Controller, HttpCode, Post, Response } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FastifyReply } from "fastify";
import { z } from "zod";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const authenticateControllerBodySchema = SessionEntity.schema.toCreate;

export type AuthenticateControllerBody = z.infer<
  typeof authenticateControllerBodySchema
>;

export const SESSION_COOKIE_NAME = "session" as const;

@Controller()
export class AuthenticateController {
  constructor(private readonly authenticateUseCase: AuthenticateUseCase) {}

  @ApiTags("Sessões")
  @Post("/sessions")
  @HttpCode(201)
  @ZodSchemaPipe({
    body: authenticateControllerBodySchema,
  })
  async handle(
    @Body() body: AuthenticateControllerBody,
    @Response({ passthrough: true }) response: FastifyReply,
  ) {
    const { session } = await this.authenticateUseCase.unsafeExecute(body);

    response.setCookie(SESSION_COOKIE_NAME, session.token.value, {
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: true,
    });
  }
}
