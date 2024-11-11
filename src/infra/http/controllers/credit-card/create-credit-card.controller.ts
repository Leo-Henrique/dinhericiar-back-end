import { CreditCardEntity } from "@/domain/entities/credit-card.entity";
import { CreateCreditCardUseCase } from "@/domain/use-cases/credit-card/create-credit-card.use-case";
import { extendApi } from "@anatine/zod-openapi";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const createCreditCardControllerBodySchema =
  CreditCardEntity.schema.toCreate.extend({
    name: extendApi(CreditCardEntity.schema.toCreate.shape.name, {
      example: "Cartão Nu",
    }),
  });

export type CreateCreditCardControllerBody = z.infer<
  typeof createCreditCardControllerBodySchema
>;

@Controller()
@AuthenticatedRoute()
export class CreateCreditCardController {
  constructor(
    private readonly createCreditCardUseCase: CreateCreditCardUseCase,
  ) {}

  @ApiTags("Cartões de crédito")
  @Post("/credit-cards")
  @HttpCode(201)
  @ZodSchemaPipe({
    body: createCreditCardControllerBodySchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Body() body: CreateCreditCardControllerBody,
  ) {
    await this.createCreditCardUseCase.unsafeExecute({
      ...body,
      authenticatedUser: user,
    });
  }
}
