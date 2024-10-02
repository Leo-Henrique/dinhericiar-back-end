import { RevokeSessionUseCase } from "@/domain/use-cases/session/revoke-session.use-case";
import { Controller, Delete, HttpCode, Response } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FastifyReply } from "fastify";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { SESSION_COOKIE_NAME } from "../../auth/session-cookie-name";

@Controller()
@AuthenticatedRoute()
export class RevokeSessionController {
  constructor(private readonly revokeSessionUseCase: RevokeSessionUseCase) {}

  @ApiTags("Sessões")
  @Delete("/sessions/me")
  @HttpCode(204)
  async handle(
    @AuthenticatedUser() { session }: AuthenticatedUserPayload,
    @Response({ passthrough: true }) response: FastifyReply,
  ) {
    await this.revokeSessionUseCase.unsafeExecute({ session });

    response.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  }
}
