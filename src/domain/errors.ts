import { DomainError } from "@/core/domain-error";

export class ValidationError extends DomainError {
  public readonly error = "ValidationError" as const;
  public readonly debug: unknown;

  constructor(debug: unknown = null) {
    super("Os dados recebidos são inválidos.");

    this.debug = debug;
  }
}

export class ResourceAlreadyExistsError extends DomainError {
  public readonly error = "ResourceAlreadyExistsError" as const;
  public readonly debug = null;

  constructor(message: string) {
    super(message);
  }
}

export class ExternalServiceError extends DomainError {
  public readonly error = "ExternalServiceError" as const;

  constructor(
    public message: string,
    public debug: unknown,
  ) {
    super(message);
  }
}
