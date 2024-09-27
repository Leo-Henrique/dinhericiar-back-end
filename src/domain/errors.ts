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

export class BadRequestError extends DomainError {
  public readonly error = "BadRequestError" as const;

  constructor(
    public message: string,
    public debug: unknown = null,
  ) {
    super(message);
  }
}

export class UserActivationTokenExpiredError extends DomainError {
  public readonly error = "UserActivationTokenExpiredError" as const;
  public readonly debug = null;

  constructor() {
    super(
      "O tempo para ativar sua conta expirou. Faça login para abrir uma nova solicitação.",
    );
  }
}

export class UserAccountAlreadyActivatedError extends DomainError {
  public readonly error = "UserAccountAlreadyActivatedError" as const;
  public readonly debug = null;

  constructor() {
    super(
      "A sua conta já está ativada. Faça login para utilizar o aplicativo.",
    );
  }
}
