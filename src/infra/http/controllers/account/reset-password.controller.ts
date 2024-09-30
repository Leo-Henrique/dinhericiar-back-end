import { UserPasswordResetTokenEntity } from "@/domain/entities/user-password-reset-token.entity";
import { ResetPasswordUseCase } from "@/domain/use-cases/account/reset-password.use-case";
import { Body, Controller, HttpCode, Patch } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const resetPasswordControllerBodySchema =
  UserPasswordResetTokenEntity.schema.toReset;

export type ResetPasswordControllerBody = z.infer<
  typeof resetPasswordControllerBodySchema
>;

@Controller()
export class ResetPasswordController {
  constructor(private readonly resetPasswordUseCase: ResetPasswordUseCase) {}

  @ApiTags("Conta")
  @Patch("/account/reset-password")
  @HttpCode(204)
  @ZodSchemaPipe({
    body: resetPasswordControllerBodySchema,
  })
  async handle(@Body() body: ResetPasswordControllerBody) {
    await this.resetPasswordUseCase.unsafeExecute(body);
  }
}
