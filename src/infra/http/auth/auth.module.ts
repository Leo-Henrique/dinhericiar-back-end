import { CheckSessionIntegrityUseCase } from "@/domain/use-cases/session/check-session-integrity.use-case";
import { CryptologyModule } from "@/infra/cryptology/cryptology.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { Module, Provider } from "@nestjs/common";

const authProviders = [CheckSessionIntegrityUseCase] satisfies Provider[];

@Module({
  imports: [CryptologyModule, DatabaseModule],
  providers: authProviders,
  exports: authProviders,
})
export class AuthModule {}
