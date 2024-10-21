import { UniqueEntityId } from "@/domain/entities/value-objects/unique-entity.id";
import { Controller, Delete, HttpCode, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";
import { DeleteCreditCardUseCase } from "@/domain/use-cases/credit-card/delete-credit-card.use-case";

const deleteCreditCardControllerParamsSchema = z.object({
  id: UniqueEntityId.schema,
});

export type DeleteCreditCardControllerParams = z.infer<
  typeof deleteCreditCardControllerParamsSchema
>;

@Controller()
@AuthenticatedRoute()
export class DeleteCreditCardController {
  constructor(
    private readonly deleteCreditCardUseCase: DeleteCreditCardUseCase,
  ) {}

  @ApiTags("Cartões de crédito")
  @Delete("/credit-cards/:id")
  @HttpCode(204)
  @ZodSchemaPipe({
    routeParams: deleteCreditCardControllerParamsSchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Param() { id }: DeleteCreditCardControllerParams,
  ) {
    await this.deleteCreditCardUseCase.unsafeExecute({
      authenticatedUser: user,
      creditCardId: id,
    });
  }
}
