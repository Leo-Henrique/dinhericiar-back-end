import { CreateBankAccountUseCase } from "@/domain/use-cases/bank-account/create-bank-account.use-case";
import { DeleteBankAccountUseCase } from "@/domain/use-cases/bank-account/delete-bank-account.use-case";
import { UpdateBankAccountUseCase } from "@/domain/use-cases/bank-account/update-bank-account.use-case";
import { DatabaseModule } from "@/infra/database/database.module";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CreateBankAccountController } from "./bank-account/create-bank-account.controller";
import { DeleteBankAccountController } from "./bank-account/delete-bank-account.controller";
import { UpdateBankAccountController } from "./bank-account/update-bank-account.controller";

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    CreateBankAccountUseCase,
    UpdateBankAccountUseCase,
    DeleteBankAccountUseCase,
  ],
  controllers: [
    CreateBankAccountController,
    UpdateBankAccountController,
    DeleteBankAccountController,
  ],
})
export class BankAccountModule {}
