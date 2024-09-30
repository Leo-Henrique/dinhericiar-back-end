import { ActivateUserAccountUseCase } from "@/domain/use-cases/account/activate-user-account.use-case";
import { ForgotPasswordUseCase } from "@/domain/use-cases/account/forgot-password.use-case";
import { RegisterUserUseCase } from "@/domain/use-cases/account/register-user.use-case";
import { ResetPasswordUseCase } from "@/domain/use-cases/account/reset-password.use-case";
import { CryptologyModule } from "@/infra/cryptology/cryptology.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { EmailModule } from "@/infra/email/email.module";
import { Module } from "@nestjs/common";
import { ActivateUserAccountController } from "./account/activate-user-account.controller";
import { ForgotPasswordController } from "./account/forgot-password.controller";
import { RegisterUserController } from "./account/register-user.controller";
import { ResetPasswordController } from "./account/reset-password.controller";

@Module({
  imports: [DatabaseModule, CryptologyModule, EmailModule],
  providers: [
    RegisterUserUseCase,
    ActivateUserAccountUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
  ],
  controllers: [
    RegisterUserController,
    ActivateUserAccountController,
    ForgotPasswordController,
    ResetPasswordController,
  ],
})
export class AccountModule {}
