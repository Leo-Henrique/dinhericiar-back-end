import { right } from "@/core/either";
import {
  EmailDispatcher,
  SendEmailOutput,
} from "@/domain/gateways/email-dispatcher";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ResendEmailDispatcher implements EmailDispatcher {
  public async sendToActivationAccount(): Promise<SendEmailOutput> {
    return right(null);
  }
}
