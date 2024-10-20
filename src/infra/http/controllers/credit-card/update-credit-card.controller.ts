import { CreditCardEntity } from "@/domain/entities/credit-card.entity";
import { UniqueEntityId } from "@/domain/entities/value-objects/unique-entity.id";
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
import { UpdateCreditCardUseCase } from "@/domain/use-cases/credit-card/update-credit-card.use-case";

const updateCreditCardControllerParamsSchema = z.object({
  id: UniqueEntityId.schema,
});

const updateCreditCardControllerBodySchema = CreditCardEntity.schema.toUpdate
  .extend({
    name: extendApi(CreditCardEntity.schema.toUpdate.shape.name, {
      example: "Cartão Nu",
    }),
  })
  .refine(val => Object.keys(val).length);

export type UpdateCreditCardControllerParams = z.infer<
  typeof updateCreditCardControllerParamsSchema
>;

export type UpdateCreditCardControllerBody = z.infer<
  typeof updateCreditCardControllerBodySchema
>;

@Controller()
@AuthenticatedRoute()
export class UpdateCreditCardController {
  constructor(
    private readonly updateCreditCardUseCase: UpdateCreditCardUseCase,
  ) {}

  @ApiTags("Cartões de crédito")
  @Put("/credit-cards/:id")
  @HttpCode(204)
  @ZodSchemaPipe({
    body: updateCreditCardControllerBodySchema,
    routeParams: updateCreditCardControllerParamsSchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Param() { id }: UpdateCreditCardControllerParams,
    @Body() body: UpdateCreditCardControllerBody,
  ) {
    await this.updateCreditCardUseCase.unsafeExecute({
      ...body,
      authenticatedUser: user,
      creditCardId: id,
    });
  }
}
