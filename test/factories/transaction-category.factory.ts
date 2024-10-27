import { ArrayWithExactLength } from "@/core/@types/array-with-exact-length";
import { Factory } from "@/core/factory";
import {
  TransactionCategoryDataCreateInput,
  TransactionCategoryEntity,
} from "@/domain/entities/transaction-category.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { drizzleTransactionCategoryTable } from "@/infra/database/drizzle/schemas/drizzle-transaction-category.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

export type TransactionCategoryFactoryInput =
  Partial<TransactionCategoryDataCreateInput>;

export type TransactionCategoryFactoryOutput = ReturnType<
  TransactionCategoryFactory["make"]
>;

@Injectable()
export class TransactionCategoryFactory extends Factory<TransactionCategoryFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: TransactionCategoryFactoryInput = {}) {
    const input = {
      userId: faker.string.uuid(),
      transactionType: faker.helpers.arrayElement(["EXPENSE", "EARNING"]),
      name: faker.lorem.sentence(),
      ...override,
    } satisfies TransactionCategoryDataCreateInput;
    const entity = TransactionCategoryEntity.create(input);

    return { input, entity };
  }

  async makeAndSaveUnique(override: TransactionCategoryFactoryInput = {}) {
    const transactionCategory = this.make(override);

    await this.drizzle?.client
      .insert(drizzleTransactionCategoryTable)
      .values(transactionCategory.entity.getRawData());

    return transactionCategory;
  }

  async makeAndSaveMany(overrides: TransactionCategoryFactoryInput[] = [{}]) {
    const transactionCategories = overrides?.map(this.make);

    await this.drizzle?.client
      ?.insert(drizzleTransactionCategoryTable)
      .values(
        transactionCategories.map(transactionCategory =>
          transactionCategory.entity.getRawData(),
        ),
      );

    return transactionCategories;
  }

  async makeAndSaveManyByAmount<Amount extends number>(
    amount: Amount = 1 as Amount,
    override: TransactionCategoryFactoryInput = {},
  ) {
    return this.makeAndSaveMany(
      Array.from({ length: amount }).map(() => override),
    ) as ArrayWithExactLength<Amount, TransactionCategoryFactoryOutput>;
  }
}
