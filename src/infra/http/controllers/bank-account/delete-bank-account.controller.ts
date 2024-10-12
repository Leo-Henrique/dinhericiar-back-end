import { UniqueEntityId } from "@/domain/entities/value-objects/unique-entity.id";
import { DeleteBankAccountUseCase } from "@/domain/use-cases/bank-account/delete-bank-account.use-case";
import { Controller, Delete, HttpCode, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const deleteBankAccountControllerParamsSchema = z.object({
  id: UniqueEntityId.schema,
});

export type DeleteBankAccountControllerParams = z.infer<
  typeof deleteBankAccountControllerParamsSchema
>;

@Controller()
@AuthenticatedRoute()
export class DeleteBankAccountController {
  constructor(
    private readonly deleteBankAccountUseCase: DeleteBankAccountUseCase,
  ) {}

  @ApiTags("Contas bancárias")
  @Delete("/bank-accounts/:id")
  @HttpCode(204)
  @ZodSchemaPipe({
    routeParams: deleteBankAccountControllerParamsSchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Param() { id }: DeleteBankAccountControllerParams,
  ) {
    await this.deleteBankAccountUseCase.unsafeExecute({
      authenticatedUser: user,
      bankAccountId: id,
    });
  }
}
