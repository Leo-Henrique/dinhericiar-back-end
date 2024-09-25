import { EmailDispatcher } from "@/domain/gateways/email-dispatcher";
import { Module, Provider } from "@nestjs/common";
import { ResendEmailDispatcher } from "./resend-email-dispatcher";

const emailProviders = [
  {
    provide: EmailDispatcher,
    useClass: ResendEmailDispatcher,
  },
] satisfies Provider[];

@Module({
  providers: emailProviders,
  exports: emailProviders.map(({ provide }) => provide),
})
export class EmailModule {}
