import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AccountModule } from "./controllers/account.module";
import { AllExceptionFilter } from "./errors/filters/all-exception.filter";
import { DomainExceptionFilter } from "./errors/filters/domain-exception.filter";
import { FastifyMulterEventModule } from "./events/fastify-multer.event.module";

@Module({
  imports: [FastifyMulterEventModule, AccountModule],
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
