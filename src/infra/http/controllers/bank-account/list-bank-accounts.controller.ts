import { paginationParamsSchema } from "@/core/schemas/pagination-params";
import { ListBankAccountsUseCase } from "@/domain/use-cases/bank-account/list-bank-accounts.use-case";
import { Controller, Get, HttpCode, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const listBankAccountsControllerQuerySchema = paginationParamsSchema.extend({
  page: paginationParamsSchema.shape.page.default(1),
  itemsPerPage: paginationParamsSchema.shape.itemsPerPage.default(6),
});

export type ListBankAccountsControllerQuery = z.infer<
  typeof listBankAccountsControllerQuerySchema
>;

@Controller()
@AuthenticatedRoute()
export class ListBankAccountsController {
  constructor(
    private readonly listBankAccountsUseCase: ListBankAccountsUseCase,
  ) {}

  @ApiTags("Contas bancárias")
  @Get("/bank-accounts")
  @HttpCode(200)
  @ZodSchemaPipe({
    queryParams: listBankAccountsControllerQuerySchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Query() query: ListBankAccountsControllerQuery,
  ) {
    const { bankAccounts, ...counts } =
      await this.listBankAccountsUseCase.unsafeExecute({
        ...query,
        authenticatedUser: user,
      });

    return {
      bankAccounts: bankAccounts.map(bankAccount => bankAccount.getRawData()),
      ...counts,
    };
  }
}
