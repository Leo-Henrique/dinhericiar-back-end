import { CreateTransactionDebitExpenseUseCase } from "@/domain/use-cases/transaction/create-transaction-debit-expense.use-case";
import { DatabaseModule } from "@/infra/database/database.module";
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { CreateTransactionDebitExpenseController } from "./transaction/create-transaction-debit-expense.controller";

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [CreateTransactionDebitExpenseUseCase],
  controllers: [CreateTransactionDebitExpenseController],
})
export class TransactionModule {}
