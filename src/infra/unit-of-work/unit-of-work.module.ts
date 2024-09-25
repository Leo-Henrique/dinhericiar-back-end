import { UnitOfWork } from "@/domain/gateways/unit-of-work";
import { Module, Provider } from "@nestjs/common";
import { DrizzleService } from "../database/drizzle/drizzle.service";
import { InfraUnitOfWork } from "./infra-unit-of-work";

const unitOfWorkProviders = [
  {
    provide: UnitOfWork,
    useClass: InfraUnitOfWork,
  },
] satisfies Provider[];

@Module({
  providers: [DrizzleService, ...unitOfWorkProviders],
  exports: [
    DrizzleService,
    ...unitOfWorkProviders.map(({ provide }) => provide),
  ],
})
export class UnitOfWorkModule {}
