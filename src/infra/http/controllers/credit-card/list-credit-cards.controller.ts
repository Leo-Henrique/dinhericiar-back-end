import { paginationParamsSchema } from "@/core/schemas/pagination-params";
import { Controller, Get, HttpCode, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";
import { ListCreditCardsUseCase } from "@/domain/use-cases/credit-card/list-credit-cards.use-case";

const listCreditCardsControllerQuerySchema = paginationParamsSchema.extend({
  page: paginationParamsSchema.shape.page.default(1),
  itemsPerPage: paginationParamsSchema.shape.itemsPerPage.default(6),
});

export type ListCreditCardsControllerQuery = z.infer<
  typeof listCreditCardsControllerQuerySchema
>;

@Controller()
@AuthenticatedRoute()
export class ListCreditCardsController {
  constructor(
    private readonly listCreditCardsUseCase: ListCreditCardsUseCase,
  ) {}

  @ApiTags("Cartões de crédito")
  @Get("/credit-cards")
  @HttpCode(200)
  @ZodSchemaPipe({
    queryParams: listCreditCardsControllerQuerySchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Query() query: ListCreditCardsControllerQuery,
  ) {
    const { creditCards, ...counts } =
      await this.listCreditCardsUseCase.unsafeExecute({
        ...query,
        authenticatedUser: user,
      });

    return {
      creditCards: creditCards.map(creditCard => creditCard.getRawData()),
      ...counts,
    };
  }
}
