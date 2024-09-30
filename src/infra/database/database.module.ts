import { SessionRepository } from "@/domain/gateways/repositories/session.repository";
import { UserActivationTokenRepository } from "@/domain/gateways/repositories/user-activation-token.repository";
import { UserPasswordResetTokenRepository } from "@/domain/gateways/repositories/user-password-reset-token.repository";
import { UserRepository } from "@/domain/gateways/repositories/user.repository";
import { Module, Provider } from "@nestjs/common";
import { UnitOfWorkModule } from "../unit-of-work/unit-of-work.module";
import { DrizzleService } from "./drizzle/drizzle.service";
import { DrizzleSessionRepository } from "./drizzle/repositories/drizzle-session.repository";
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
