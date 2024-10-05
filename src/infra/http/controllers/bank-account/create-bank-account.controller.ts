import { BankAccountEntity } from "@/domain/entities/bank-account.entity";

import { CreateBankAccountUseCase } from "@/domain/use-cases/bank-account/create-bank-account.use-case";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";
import { extendApi } from "@anatine/zod-openapi";

const createBankAccountControllerBodySchema =
  BankAccountEntity.schema.toCreate.extend({
    institution: extendApi(
      BankAccountEntity.schema.toCreate.shape.institution,
      {
        example: "NU PAGAMENTOS S.A.",
      },
    ),
    name: extendApi(BankAccountEntity.schema.toCreate.shape.name, {
      example: "Pessoal",
    }),
  });

export type CreateBankAccountControllerBody = z.infer<
  typeof createBankAccountControllerBodySchema
>;

@Controller()
@AuthenticatedRoute()
export class CreateBankAccountController {
  constructor(
    private readonly createBankAccountUseCase: CreateBankAccountUseCase,
  ) {}

  @ApiTags("Contas bancárias")
  @Post("/bank-accounts")
  @HttpCode(204)
  @ZodSchemaPipe({
    body: createBankAccountControllerBodySchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Body() body: CreateBankAccountControllerBody,
  ) {
    await this.createBankAccountUseCase.unsafeExecute({
      ...body,
      authenticatedUser: user,
    });
  }
}
