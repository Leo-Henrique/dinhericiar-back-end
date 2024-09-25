import { RegisterUserUseCase } from "@/domain/use-cases/account/register-user.use-case";
import { CryptologyModule } from "@/infra/cryptology/cryptology.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { EmailModule } from "@/infra/email/email.module";
import { Module } from "@nestjs/common";
import { RegisterUserController } from "./account/register-user.controller";

@Module({
  imports: [DatabaseModule, CryptologyModule, EmailModule],
  providers: [RegisterUserUseCase],
  controllers: [RegisterUserController],
})
export class AccountModule {}
