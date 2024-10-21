import { Slug } from "@/domain/entities/value-objects/slug";
import { GetCreditCardBySlugUseCase } from "@/domain/use-cases/credit-card/get-credit-card-by-slug.use-case";
import { Controller, Get, HttpCode, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const getCreditCardBySlugControllerParamsSchema = z.object({
  slug: Slug.schema,
});

export type GetCreditCardBySlugControllerParams = z.infer<
  typeof getCreditCardBySlugControllerParamsSchema
>;

@Controller()
@AuthenticatedRoute()
export class GetCreditCardBySlugController {
  constructor(
    private readonly getCreditCardBySlugUseCase: GetCreditCardBySlugUseCase,
  ) {}

  @ApiTags("Cartões de crédito")
  @Get("/credit-cards/:slug")
  @HttpCode(200)
  @ZodSchemaPipe({
    routeParams: getCreditCardBySlugControllerParamsSchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Param() { slug }: GetCreditCardBySlugControllerParams,
  ) {
    const { creditCard } = await this.getCreditCardBySlugUseCase.unsafeExecute({
      authenticatedUser: user,
      slug,
    });

    return {
      creditCard: creditCard.getRawData(),
    };
  }
}
