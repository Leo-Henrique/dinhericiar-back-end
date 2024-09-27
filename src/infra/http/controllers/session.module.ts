import { AuthenticateUseCase } from "@/domain/use-cases/session/authenticate.use-case";
import { CryptologyModule } from "@/infra/cryptology/cryptology.module";
import { DatabaseModule } from "@/infra/database/database.module";
import { EmailModule } from "@/infra/email/email.module";
import { Module } from "@nestjs/common";
import { AuthenticateController } from "./session/authenticate.controller";

@Module({
  imports: [DatabaseModule, CryptologyModule, EmailModule],
  providers: [AuthenticateUseCase],
  controllers: [AuthenticateController],
})
export class SessionModule {}
