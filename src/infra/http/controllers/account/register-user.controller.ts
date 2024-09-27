import { UserEntity } from "@/domain/entities/user.entity";
import { RegisterUserUseCase } from "@/domain/use-cases/account/register-user.use-case";
import { extendApi } from "@anatine/zod-openapi";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const registerUserControllerBodySchema = UserEntity.schema.toCreate.extend({
  name: extendApi(UserEntity.schema.toCreate.shape.name, {
    example: "John Doe",
  }),
});

export type RegisterUserControllerBody = z.infer<
  typeof registerUserControllerBodySchema
>;

@Controller()
export class RegisterUserController {
  constructor(private readonly registerUserUseCase: RegisterUserUseCase) {}

  @ApiTags("Usuários")
  @Post("/users")
  @HttpCode(201)
  @ZodSchemaPipe({
    body: registerUserControllerBodySchema,
  })
  async handle(@Body() body: RegisterUserControllerBody) {
    await this.registerUserUseCase.unsafeExecute(body);
  }
}
