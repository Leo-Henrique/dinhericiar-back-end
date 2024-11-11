import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { CreditCardRepository } from "@/domain/gateways/repositories/credit-card.repository";
import { SessionRepository } from "@/domain/gateways/repositories/session.repository";
import { TransactionCategoryRepository } from "@/domain/gateways/repositories/transaction-category.repository";
import { TransactionDebitExpenseRepository } from "@/domain/gateways/repositories/transaction-debit-expense.repository";
import { TransactionRecurrenceFixedRepository } from "@/domain/gateways/repositories/transaction-recurrence-fixed.repository";
import { UserActivationTokenRepository } from "@/domain/gateways/repositories/user-activation-token.repository";
import { UserPasswordResetTokenRepository } from "@/domain/gateways/repositories/user-password-reset-token.repository";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";
import { Module, Provider } from "@nestjs/common";
import { UnitOfWorkModule } from "../unit-of-work/unit-of-work.module";
import { DrizzleService } from "./drizzle/drizzle.service";
import { DrizzleBankAccountRepository } from "./drizzle/repositories/drizzle-bank-account.repository";
import { DrizzleCreditCardRepository } from "./drizzle/repositories/drizzle-credit-card.repository";
import { DrizzleSessionRepository } from "./drizzle/repositories/drizzle-session.repository";
import { DrizzleTransactionCategoryRepository } from "./drizzle/repositories/drizzle-transaction-category.repository";
import { DrizzleTransactionDebitExpenseRepository } from "./drizzle/repositories/drizzle-transaction-debit-expense.repository";
import { DrizzleTransactionRecurrenceFixedRepository } from "./drizzle/repositories/drizzle-transaction-recurrence-fixed.repository";
import { DrizzleUserActivationTokenRepository } from "./drizzle/repositories/drizzle-user-activation-token.repository";
import { DrizzleUserPasswordResetTokenRepository } from "./drizzle/repositories/drizzle-user-password-reset-token.repository";
import { DrizzleUserRepository } from "./drizzle/repositories/drizzle-user.repository";

const databaseProviders = [
  {
    provide: UserRepository,
    useClass: DrizzleUserRepository,
  },
  {
    provide: UserActivationTokenRepository,
    useClass: DrizzleUserActivationTokenRepository,
  },
  {
    provide: SessionRepository,
    useClass: DrizzleSessionRepository,
  },
  {
    provide: UserPasswordResetTokenRepository,
    useClass: DrizzleUserPasswordResetTokenRepository,
  },
  {
    provide: BankAccountRepository,
    useClass: DrizzleBankAccountRepository,
  },
  {
    provide: CreditCardRepository,
    useClass: DrizzleCreditCardRepository,
  },
  {
    provide: TransactionCategoryRepository,
    useClass: DrizzleTransactionCategoryRepository,
  },
  {
    provide: TransactionDebitExpenseRepository,
    useClass: DrizzleTransactionDebitExpenseRepository,
  },
  {
    provide: TransactionRecurrenceFixedRepository,
    useClass: DrizzleTransactionRecurrenceFixedRepository,
  },
] satisfies Provider[];

@Module({
  imports: [UnitOfWorkModule],
  providers: [DrizzleService, ...databaseProviders],
  exports: [
    DrizzleService,
    UnitOfWorkModule,
    ...databaseProviders.map(({ provide }) => provide),
  ],
})
export class DatabaseModule {}
