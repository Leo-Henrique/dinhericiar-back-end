import { DomainError } from "@/core/domain-error";
import { env } from "../env";

type CustomError = Pick<DomainError, "error" | "message" | "debug">;

export class ErrorPresenter {
  public static toHttp(statusCode: number, error: DomainError | CustomError) {
    return {
      error: error.error,
      message: error.message,
      statusCode,
      debug: env.NODE_ENV !== "production" ? error.debug : null,
    };
  }
}
