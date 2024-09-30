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

export class ResourceNotFoundError extends DomainError {
  public readonly error = "ResourceNotFoundError" as const;
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
      "O tempo para confirmar seu e-mail expirou. Faça login para abrir uma nova solicitação.",
    );
  }
}

export class UserAccountAlreadyActivatedError extends DomainError {
  public readonly error = "UserAccountAlreadyActivatedError" as const;
  public readonly debug = null;

  constructor() {
    super(
      "O e-mail da sua conta já foi confirmado. Faça login para utilizar o aplicativo.",
    );
  }
}

export class UserAccountNotActivatedError extends DomainError {
  public readonly error = "UserAccountNotActivatedError" as const;
  public readonly debug = null;

  constructor() {
    super(
      "O e-mail da sua conta ainda não foi confirmado, lhe enviamos um e-mail com instruções para que você possa confirma-lo.",
    );
  }
}

export class UserPasswordResetTokenExpiredError extends DomainError {
  public readonly error = "UserPasswordResetTokenExpiredError" as const;
  public readonly debug = null;

  constructor() {
    super(
      "O tempo para redefinir sua senha expirou. Abra uma nova solicitação para poder alterar sua senha.",
    );
  }
}

export class InvalidCredentialsError extends DomainError {
  public readonly error = "InvalidCredentialsError" as const;
  public readonly debug = null;

  constructor() {
    super(
      "As credenciais são inválidas. Verifique se seu e-mail e senha estão corretos.",
    );
  }
}
