import { TransactionDebitExpenseEntitySchema } from "@/domain/entities/schemas/transaction-debit-expense.schema";
import { ValidationError } from "@/domain/errors";
import { CreateFixedTransactionDebitExpenseUseCase } from "@/domain/use-cases/transaction/create-fixed-transaction-debit-expense.use-case";
import { CreateInstallmentTransactionDebitExpenseUseCase } from "@/domain/use-cases/transaction/create-installment-transaction-debit-expense.use-case";
import { CreateUniqueTransactionDebitExpenseUseCase } from "@/domain/use-cases/transaction/create-unique-transaction-debit-expense.use-case";
import { Body, Controller, HttpCode, Post, Query } from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { AuthenticatedRoute } from "../../auth/authenticated-route-decorator";
import {
  AuthenticatedUser,
  AuthenticatedUserPayload,
} from "../../auth/authenticated-user-decorator";
import {
  ZodSchemaPipe,
  zodSchemaToSwaggerSchema,
} from "../../middlewares/zod-schema-pipe";

const createTransactionDebitExpenseControllerQuerySchema = z.object({
  recurrence: z.enum(["INSTALLMENT", "FIXED"]).optional(),
});

export type CreateTransactionDebitExpenseControllerQuery = z.infer<
  typeof createTransactionDebitExpenseControllerQuerySchema
>;

@Controller()
@AuthenticatedRoute()
export class CreateTransactionDebitExpenseController {
  constructor(
    private readonly createUniqueTransactionDebitExpenseUseCase: CreateUniqueTransactionDebitExpenseUseCase,
    private readonly createInstallmentTransactionDebitExpenseUseCase: CreateInstallmentTransactionDebitExpenseUseCase,
    private readonly createFixedTransactionDebitExpenseUseCase: CreateFixedTransactionDebitExpenseUseCase,
  ) {}

  @ApiTags("Transações")
  @Post("/transactions/expenses")
  @HttpCode(201)
  @ZodSchemaPipe({
    queryParams: createTransactionDebitExpenseControllerQuerySchema,
  })
  @ApiBody({
    schema: zodSchemaToSwaggerSchema(
      TransactionDebitExpenseEntitySchema.toCreateUnique
        .merge(TransactionDebitExpenseEntitySchema.toCreateInstallment)
        .merge(TransactionDebitExpenseEntitySchema.toCreateFixed.innerType()),
    ),
  })
  async handle(
    @AuthenticatedUser() { user }: AuthenticatedUserPayload,
    @Query() { recurrence }: CreateTransactionDebitExpenseControllerQuery,
    @Body() body: unknown,
  ) {
    if (recurrence === "INSTALLMENT") {
      const parsedInput =
        TransactionDebitExpenseEntitySchema.toCreateInstallment.safeParse(body);

      if (!parsedInput.success)
        throw new ValidationError(parsedInput.error.flatten().fieldErrors);

      await this.createInstallmentTransactionDebitExpenseUseCase.unsafeExecute({
        ...parsedInput.data,
        authenticatedUser: user,
      });

      return;
    }

    if (recurrence === "FIXED") {
      const parsedInput =
        TransactionDebitExpenseEntitySchema.toCreateFixed.safeParse(body);

      if (!parsedInput.success)
        throw new ValidationError(parsedInput.error.flatten().fieldErrors);

      await this.createFixedTransactionDebitExpenseUseCase.unsafeExecute({
        ...parsedInput.data,
        authenticatedUser: user,
      });

      return;
    }

    const parsedInput =
      TransactionDebitExpenseEntitySchema.toCreateUnique.safeParse(body);

    if (!parsedInput.success)
      throw new ValidationError(parsedInput.error.flatten().fieldErrors);

    await this.createUniqueTransactionDebitExpenseUseCase.unsafeExecute({
      ...parsedInput.data,
      authenticatedUser: user,
    });
  }
}
