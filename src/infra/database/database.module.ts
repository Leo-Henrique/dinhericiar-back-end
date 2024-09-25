import { Module, Provider } from "@nestjs/common";
import { DrizzleService } from "./drizzle/drizzle.service";

const databaseProviders = [] satisfies Provider[];

@Module({
  providers: [DrizzleService, ...databaseProviders],
  exports: [DrizzleService, ...databaseProviders.map(({ provide }) => provide)],
})
export class DatabaseModule {}
