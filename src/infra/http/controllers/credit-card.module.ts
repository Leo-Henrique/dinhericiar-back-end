import { CreateCreditCardUseCase } from "@/domain/use-cases/credit-card/create-credit-card.use-case";
import { DatabaseModule } from "@/infra/database/database.module";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CreateCreditCardController } from "./credit-card/create-credit-card.controller";

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [CreateCreditCardUseCase],
  controllers: [CreateCreditCardController],
})
export class CreditCardModule {}
