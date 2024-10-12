import { Slug } from "@/domain/entities/value-objects/slug";
import { GetBankAccountBySlugUseCase } from "@/domain/use-cases/bank-account/get-bank-account-by-slug.use-case";
import { Controller, Get, HttpCode, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const getBankAccountBySlugControllerParamsSchema = z.object({
  slug: Slug.schema,
});

export type GetBankAccountBySlugControllerParams = z.infer<
  typeof getBankAccountBySlugControllerParamsSchema
>;

@Controller()
@AuthenticatedRoute()
export class GetBankAccountBySlugController {
  constructor(
    private readonly getBankAccountBySlugUseCase: GetBankAccountBySlugUseCase,
  ) {}

  @ApiTags("Contas bancárias")
  @Get("/bank-accounts/:slug")
  @HttpCode(200)
  @ZodSchemaPipe({
    routeParams: getBankAccountBySlugControllerParamsSchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Param() { slug }: GetBankAccountBySlugControllerParams,
  ) {
    const { bankAccount } =
      await this.getBankAccountBySlugUseCase.unsafeExecute({
        authenticatedUser: user,
        slug,
      });

    return {
      bankAccount: bankAccount.getRawData(),
    };
  }
}
