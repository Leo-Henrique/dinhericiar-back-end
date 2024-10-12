import { CreateBankAccountUseCase } from "@/domain/use-cases/bank-account/create-bank-account.use-case";
import { DeleteBankAccountUseCase } from "@/domain/use-cases/bank-account/delete-bank-account.use-case";
import { GetBankAccountBySlugUseCase } from "@/domain/use-cases/bank-account/get-bank-account-by-slug.use-case";
import { ListBankAccountsUseCase } from "@/domain/use-cases/bank-account/list-bank-accounts.use-case";
import { UpdateBankAccountUseCase } from "@/domain/use-cases/bank-account/update-bank-account.use-case";
import { DatabaseModule } from "@/infra/database/database.module";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CreateBankAccountController } from "./bank-account/create-bank-account.controller";
import { DeleteBankAccountController } from "./bank-account/delete-bank-account.controller";
import { GetBankAccountBySlugController } from "./bank-account/get-bank-account-by-slug.controller";
import { ListBankAccountsController } from "./bank-account/list-bank-accounts.controller";
import { UpdateBankAccountController } from "./bank-account/update-bank-account.controller";

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    CreateBankAccountUseCase,
    UpdateBankAccountUseCase,
    DeleteBankAccountUseCase,
    GetBankAccountBySlugUseCase,
    ListBankAccountsUseCase,
  ],
  controllers: [
    CreateBankAccountController,
    UpdateBankAccountController,
    DeleteBankAccountController,
    GetBankAccountBySlugController,
    ListBankAccountsController,
  ],
})
export class BankAccountModule {}
