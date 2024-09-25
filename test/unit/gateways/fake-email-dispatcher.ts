import { right } from "@/core/either";
import {
  EmailDispatcher,
  SendEmailOutput,
} from "@/domain/gateways/email-dispatcher";

export class FakeEmailDispatcher implements EmailDispatcher {
  async sendToActivationAccount(): Promise<SendEmailOutput> {
    return right(null);
  }
}
