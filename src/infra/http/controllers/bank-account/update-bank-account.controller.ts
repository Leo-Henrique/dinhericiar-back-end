import { BankAccountEntity } from "@/domain/entities/bank-account.entity";
import { UniqueEntityId } from "@/domain/entities/value-objects/unique-entity.id";
import { UpdateBankAccountUseCase } from "@/domain/use-cases/bank-account/update-bank-account.use-case";
import { extendApi } from "@anatine/zod-openapi";
import { Body, Controller, HttpCode, Param, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const updateBankAccountControllerParamsSchema = z.object({
  id: UniqueEntityId.schema,
});

const updateBankAccountControllerBodySchema = BankAccountEntity.schema.toUpdate
  .extend({
    institution: extendApi(
      BankAccountEntity.schema.toUpdate.shape.institution,
      {
        example: "NU PAGAMENTOS S.A.",
      },
    ),
    name: extendApi(BankAccountEntity.schema.toUpdate.shape.name, {
      example: "Pessoal",
    }),
  })
  .refine(val => Object.keys(val).length);

export type UpdateBankAccountControllerParams = z.infer<
  typeof updateBankAccountControllerParamsSchema
>;

export type UpdateBankAccountControllerBody = z.infer<
  typeof updateBankAccountControllerBodySchema
>;

@Controller()
@AuthenticatedRoute()
export class UpdateBankAccountController {
  constructor(
    private readonly updateBankAccountUseCase: UpdateBankAccountUseCase,
  ) {}

  @ApiTags("Contas bancárias")
  @Put("/bank-accounts/:id")
  @HttpCode(204)
  @ZodSchemaPipe({
    body: updateBankAccountControllerBodySchema,
    routeParams: updateBankAccountControllerParamsSchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Param() { id }: UpdateBankAccountControllerParams,
    @Body() body: UpdateBankAccountControllerBody,
  ) {
    await this.updateBankAccountUseCase.unsafeExecute({
      ...body,
      authenticatedUser: user,
      bankAccountId: id,
    });
  }
}
