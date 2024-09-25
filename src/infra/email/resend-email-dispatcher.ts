import { left, right } from "@/core/either";
import { UserActivationToken } from "@/domain/entities/user-activation-token.entity";
import { User } from "@/domain/entities/user.entity";
import { ExternalServiceError } from "@/domain/errors";
import {
  EmailDispatcher,
  SendEmailOutput,
} from "@/domain/gateways/email-dispatcher";
import { Injectable } from "@nestjs/common";
import { Resend } from "resend";
import { env } from "../env";

// TODO: create html templates for the body of email messages

const resend = new Resend(env.RESEND_API_KEY);

@Injectable()
export class ResendEmailDispatcher implements EmailDispatcher {
  private get sender() {
    return `${env.API_NAME} <${env.RESEND_EMAIL_SENDER}>`;
  }

  private getRecipient(user: User) {
    return env.NODE_ENV === "production"
      ? user.email.value
      : env.RESEND_EMAIL_SENDER;
  }

  async sendToActivationAccount(
    recipient: User,
    accountActivationToken: UserActivationToken,
  ): Promise<SendEmailOutput> {
    // TODO: implement end-to-end email sending testing
    if (env.NODE_ENV === "test") return right(null);

    const clientSideActivationPageUrl = new URL(
      env.API_ACCESS_PERMISSION_CLIENT_SIDE,
    );

    clientSideActivationPageUrl.pathname = `cadastro/confirmar-email`;
    clientSideActivationPageUrl.searchParams.set(
      "token",
      accountActivationToken.token.value,
    );

    const { error } = await resend.emails.send({
      from: this.sender,
      to: [this.getRecipient(recipient)],
      subject: "Confirme seu e-mail",
      html: `
        <p>Olá, ${recipient.name.value}!</p>

        <p>
          Estamos enviando esse e-mail porque você criou uma conta no ${env.API_NAME} e precisa confirmar seu endereço de e-mail para utilizar o aplicativo.
        </p>

        <a href="${clientSideActivationPageUrl.toString()}" target="_blank">
          Clique aqui para confirmar seu e-mail.
        </a>

        <p>Ou copie e cole o endereço abaixo na barra de pesquisa do seu navegador:</p>

        <p>${clientSideActivationPageUrl.toString()}</p>

        <p>Se você não criou uma conta no ${env.API_NAME}, apenas ignore este e-mail.</p>
      `,
    });

    if (error)
      return left(
        new ExternalServiceError(
          `Ocorreu uma falha inesperada ao enviarmos um e-mail para você ativar sua conta. Por favor, tente novamente em alguns minutos.`,
          error,
        ),
      );

    return right(null);
  }
}
