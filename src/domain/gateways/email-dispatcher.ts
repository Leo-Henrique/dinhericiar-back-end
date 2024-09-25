import { Either } from "@/core/either";
import { UserActivationToken } from "../entities/user-activation-token.entity";
import { User } from "../entities/user.entity";
import { ExternalServiceError } from "../errors";

export type SendEmailOutput = Either<ExternalServiceError, null>;

export abstract class EmailDispatcher {
  abstract sendToActivationAccount(
    recipient: User,
    userActivationToken: UserActivationToken,
  ): Promise<SendEmailOutput>;
}
