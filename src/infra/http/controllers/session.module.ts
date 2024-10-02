import { AuthenticateUseCase } from "@/domain/use-cases/session/authenticate.use-case";
import { OnGetCurrentSessionUseCase } from "@/domain/use-cases/session/on-get-current-session.use-case";
import { RevokeSessionUseCase } from "@/domain/use-cases/session/revoke-session.use-case";
import { CryptologyModule } from "@/infra/cryptology/cryptology.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { EmailModule } from "@/infra/email/email.module";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuthenticateController } from "./session/authenticate.controller";
import { GetCurrentSessionController } from "./session/get-current-session.controller";
import { RevokeSessionController } from "./session/revoke-session.controller";

@Module({
  imports: [DatabaseModule, CryptologyModule, EmailModule, AuthModule],
  providers: [
    AuthenticateUseCase,
    OnGetCurrentSessionUseCase,
    RevokeSessionUseCase,
  ],
  controllers: [
    AuthenticateController,
    GetCurrentSessionController,
    RevokeSessionController,
  ],
})
export class SessionModule {}
