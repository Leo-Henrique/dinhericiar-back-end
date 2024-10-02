import { UseGuards, applyDecorators } from "@nestjs/common";
import { SessionTokenGuard } from "./session-token-guard";

export function AuthenticatedRoute() {
  return applyDecorators(UseGuards(SessionTokenGuard));
}
