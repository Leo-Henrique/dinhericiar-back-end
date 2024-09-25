import { DomainError } from "@/core/domain-error";
import {
  ExternalServiceError,
  ResourceAlreadyExistsError,
  ValidationError,
} from "@/domain/errors";
import { env } from "@/infra/env";
import { ErrorPresenter } from "@/infra/presenters/error.presenter";
import {
  ArgumentsHost,
  BadGatewayException,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { InternalServerError } from "../internal-server.error";

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();

    let httpException: HttpException;

    switch (exception.constructor) {
      case ValidationError:
        httpException = new BadRequestException(
          ErrorPresenter.toHttp(400, exception),
        );
        break;

      case ResourceAlreadyExistsError:
        httpException = new ConflictException(
          ErrorPresenter.toHttp(409, exception),
        );
        break;

      case ExternalServiceError:
        httpException = new BadGatewayException(
          ErrorPresenter.toHttp(502, exception),
        );
        break;

      default:
        httpException = new InternalServerError(exception.message);
    }

    if (env.NODE_ENV !== "test") console.error(exception);

    response
      .status(httpException.getStatus())
      .send(httpException.getResponse());
  }
}
