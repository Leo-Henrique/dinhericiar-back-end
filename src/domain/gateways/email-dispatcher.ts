import { Either } from "@/core/either";
import { UserActivationToken } from "../entities/user-activation-token.entity";
import { UserPasswordResetToken } from "../entities/user-password-reset-token.entity";
import { User } from "../entities/user.entity";
import { ExternalServiceError } from "../errors";

export type SendEmailOutput = Either<ExternalServiceError, null>;

export abstract class EmailDispatcher {
  abstract sendToActivationAccount(
    recipient: User,
    userActivationToken: UserActivationToken,
  ): Promise<SendEmailOutput>;
  abstract sendToResetPassword(
    recipient: User,
    userPasswordResetToken: UserPasswordResetToken,
  ): Promise<SendEmailOutput>;
}
