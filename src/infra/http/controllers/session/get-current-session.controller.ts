import { OnGetCurrentSessionUseCase } from "@/domain/use-cases/session/on-get-current-session.use-case";
import { Controller, Get, HttpCode } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";

@Controller()
@AuthenticatedRoute()
export class GetCurrentSessionController {
  constructor(
    private readonly onGetCurrentSessionUseCase: OnGetCurrentSessionUseCase,
  ) {}

  @ApiTags("Sessões")
  @Get("/sessions/me")
  @HttpCode(200)
  async handle(
    @AuthenticatedUser() { user, session }: AuthenticatedUserPayload,
  ) {
    await this.onGetCurrentSessionUseCase.unsafeExecute({ session });

    return {
      user: user.getBasePresenter(),
    };
  }
}
