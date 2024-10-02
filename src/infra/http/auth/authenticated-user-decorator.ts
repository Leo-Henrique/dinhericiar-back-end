import { Session } from "@/domain/entities/session.entity";
import { User } from "@/domain/entities/user.entity";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { FastifyRequest } from "fastify";

export interface AuthenticatedUserPayload {
  user: User;
  session: Session;
}

export interface FastifyRequestWithUser extends FastifyRequest {
  currentSession: AuthenticatedUserPayload;
}

export const AuthenticatedUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequestWithUser>();

    return request.currentSession;
  },
);
