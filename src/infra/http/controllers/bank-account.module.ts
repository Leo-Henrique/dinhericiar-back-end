import { CreateBankAccountUseCase } from "@/domain/use-cases/bank-account/create-bank-account.use-case";
import { DatabaseModule } from "@/infra/database/database.module";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CreateBankAccountController } from "./bank-account/create-bank-account.controller";

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [CreateBankAccountUseCase],
  controllers: [CreateBankAccountController],
})
export class BankAccountModule {}
