import { TransactionDebitExpenseEntity } from "@/domain/entities/transaction-debit-expense.entity";
import { CreateTransactionDebitExpenseUseCase } from "@/domain/use-cases/transaction/create-transaction-debit-expense.use-case";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import { ZodSchemaPipe } from "../../middlewares/zod-schema-pipe";

const createTransactionDebitExpenseControllerBodySchema =
  TransactionDebitExpenseEntity.schema.toCreate;

export type CreateTransactionDebitExpenseControllerBody = z.infer<
  typeof createTransactionDebitExpenseControllerBodySchema
>;

@Controller()
@AuthenticatedRoute()
export class CreateTransactionDebitExpenseController {
  constructor(
    private readonly createDebitExpenseTransactionUseCase: CreateTransactionDebitExpenseUseCase,
  ) {}

  @ApiTags("Transações")
  @Post("/transactions/expenses")
  @HttpCode(201)
  @ZodSchemaPipe({
    body: createTransactionDebitExpenseControllerBodySchema,
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Body() body: CreateTransactionDebitExpenseControllerBody,
  ) {
    await this.createDebitExpenseTransactionUseCase.unsafeExecute({
      ...body,
      authenticatedUser: user,
    });
  }
}
