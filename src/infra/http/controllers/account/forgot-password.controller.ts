import { UserPasswordResetTokenEntity } from "@/domain/entities/user-password-reset-token.entity";
import { ForgotPasswordUseCase } from "@/domain/use-cases/account/forgot-password.use-case";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const forgotPasswordControllerBodySchema =
  UserPasswordResetTokenEntity.schema.toCreate;

export type ForgotPasswordControllerBody = z.infer<
  typeof forgotPasswordControllerBodySchema
>;

@Controller()
export class ForgotPasswordController {
  constructor(private readonly forgotPasswordUseCase: ForgotPasswordUseCase) {}

  @ApiTags("Conta")
  @Post("/account/forgot-password")
  @HttpCode(204)
  @ZodSchemaPipe({
    body: forgotPasswordControllerBodySchema,
  })
  async handle(@Body() body: ForgotPasswordControllerBody) {
    await this.forgotPasswordUseCase.unsafeExecute(body);
  }
}
