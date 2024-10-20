import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AccountModule } from "./controllers/account.module";
import { BankAccountModule } from "./controllers/bank-account.module";
import { CreditCardModule } from "./controllers/credit-card.module";
import { SessionModule } from "./controllers/session.module";
import { AllExceptionFilter } from "./errors/filters/all-exception.filter";
import { DomainExceptionFilter } from "./errors/filters/domain-exception.filter";
import { FastifyCookieEventModule } from "./events/fastify-cookie.event.module";
import { FastifyMulterEventModule } from "./events/fastify-multer.event.module";

@Module({
  imports: [
    FastifyMulterEventModule,
    FastifyCookieEventModule,
    AccountModule,
    SessionModule,
    BankAccountModule,
    CreditCardModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class HttpModule {}
