import { CreateCreditCardUseCase } from "@/domain/use-cases/credit-card/create-credit-card.use-case";
import { DeleteCreditCardUseCase } from "@/domain/use-cases/credit-card/delete-credit-card.use-case";
import { UpdateCreditCardUseCase } from "@/domain/use-cases/credit-card/update-credit-card.use-case";
import { DatabaseModule } from "@/infra/database/database.module";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CreateCreditCardController } from "./credit-card/create-credit-card.controller";
import { DeleteCreditCardController } from "./credit-card/delete-credit-card.controller";
import { UpdateCreditCardController } from "./credit-card/update-credit-card.controller";

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [
    CreateCreditCardUseCase,
    UpdateCreditCardUseCase,
    DeleteCreditCardUseCase,
  ],
  controllers: [
    CreateCreditCardController,
    UpdateCreditCardController,
    DeleteCreditCardController,
  ],
})
export class CreditCardModule {}
