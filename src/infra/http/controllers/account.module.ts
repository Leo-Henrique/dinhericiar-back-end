import { ActivateUserAccountUseCase } from "@/domain/use-cases/account/activate-user-account.use-case";
import { RegisterUserUseCase } from "@/domain/use-cases/account/register-user.use-case";
import { CryptologyModule } from "@/infra/cryptology/cryptology.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { EmailModule } from "@/infra/email/email.module";
import { Module } from "@nestjs/common";
import { ActivateUserAccountController } from "./account/activate-user-account.controller";
import { RegisterUserController } from "./account/register-user.controller";

@Module({
  imports: [DatabaseModule, CryptologyModule, EmailModule],
  providers: [RegisterUserUseCase, ActivateUserAccountUseCase],
  controllers: [RegisterUserController, ActivateUserAccountController],
})
export class AccountModule {}
