import { Factory } from "@/core/factory";
import { TransactionCategoryData } from "@/domain/entities/transaction-category.entity";
import {
  TransactionDebitExpenseDataCreateInput,
  TransactionDebitExpenseEntity,
} from "@/domain/entities/transaction-debit-expense.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleTransactionDebitExpenseMapper } from "@/infra/database/drizzle/mappers/drizzle-transaction-debit-expense.mapper";
import {
  DrizzleTransactionDebitExpenseData,
  DrizzleTransactionDebitExpenseDataCreate,
  drizzleTransactionDebitExpenseTable,
} from "@/infra/database/drizzle/schemas/drizzle-transaction-debit-expense.schema";
import {
  DrizzleTransactionData,
  DrizzleTransactionDataCreate,
  drizzleTransactionTable,
} from "@/infra/database/drizzle/schemas/drizzle-transaction.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

export type TransactionDebitExpenseFactoryInput =
  Partial<TransactionDebitExpenseDataCreateInput>;

export type TransactionDebitExpenseFactoryOutput = ReturnType<
  TransactionDebitExpenseFactory["make"]
>;

@Injectable()
export class TransactionDebitExpenseFactory extends Factory<TransactionDebitExpenseFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: TransactionDebitExpenseFactoryInput = {}) {
    const input = {
      bankAccountId: faker.string.uuid(),
      transactionCategoryId: faker.string.uuid(),
      transactedAt: faker.date.recent(),
      isAccomplished: false,
      description: faker.lorem.sentence(),
      amount: faker.number.float({ min: 1, fractionDigits: 2 }),
      ...override,
    } satisfies TransactionDebitExpenseDataCreateInput;
    const entity = TransactionDebitExpenseEntity.create(input);

    return { input, entity };
  }

  async makeAndSaveUnique(override: TransactionDebitExpenseFactoryInput = {}) {
    const transactionDebitExpense = this.make(override);
    const { drizzleTransactionValues, drizzleTransactionDebitExpenseValues } =
      DrizzleTransactionDebitExpenseMapper.toDrizzle(
        transactionDebitExpense.entity,
      );

    await this.drizzle?.client
      .insert(drizzleTransactionTable)
      .values(drizzleTransactionValues);
    await this.drizzle?.client
      .insert(drizzleTransactionDebitExpenseTable)
      .values(drizzleTransactionDebitExpenseValues);

    return transactionDebitExpense;
  }

  async makeAndSaveMany(
    overrides: TransactionDebitExpenseFactoryInput[] = [{}],
  ) {
    const transactionDebitExpenses = overrides?.map(this.make);
    const drizzleTransactionAllValues: DrizzleTransactionDataCreate[] = [];
    const drizzleTransactionDebitExpenseAllValues: DrizzleTransactionDebitExpenseDataCreate[] =
      [];

    for (const { entity } of transactionDebitExpenses) {
      const { drizzleTransactionValues, drizzleTransactionDebitExpenseValues } =
        DrizzleTransactionDebitExpenseMapper.toDrizzle(entity);

      drizzleTransactionAllValues.push(drizzleTransactionValues);
      drizzleTransactionDebitExpenseAllValues.push(
        drizzleTransactionDebitExpenseValues,
      );
    }

    await this.drizzle?.client
      ?.insert(drizzleTransactionTable)
      .values(drizzleTransactionAllValues);
    await this.drizzle?.client
      ?.insert(drizzleTransactionTable)
      .values(drizzleTransactionAllValues);

    return transactionDebitExpenses;
  }

  async getLastCreatedWithCategory() {
    type Row = DrizzleTransactionData &
      DrizzleTransactionDebitExpenseData & {
        categoryName: TransactionCategoryData["name"];
        transactionType: TransactionCategoryData["transactionType"];
      };

    const query = sql`
      SELECT
        transactions.*,
        transaction_debit_expenses.*,
        transaction_categories.name AS category_name,
        transaction_categories.transaction_type
      FROM 
        transactions
      INNER JOIN
        transaction_debit_expenses 
      ON 
        transaction_debit_expenses.transaction_id = transactions.id
      INNER JOIN
        transaction_categories 
      ON 
        transaction_categories.id = transaction_debit_expenses.transaction_category_id
      ORDER BY
        transactions.created_at DESC
      LIMIT
        1
    `;

    const [debitExpenseTransactionOnDatabase] =
      await this.drizzle!.executeToGet<Row>(query);

    return debitExpenseTransactionOnDatabase;
  }
}
