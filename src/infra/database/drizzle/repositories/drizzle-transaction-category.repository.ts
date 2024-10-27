import {
  TransactionCategory,
  TransactionCategoryDataUpdateInput,
  TransactionCategoryEntity,
} from "@/domain/entities/transaction-category.entity";
import { User } from "@/domain/entities/user.entity";
import { TransactionCategoryRepository } from "@/domain/gateways/repositories/transaction-category.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService, DrizzleSession } from "../drizzle.service";
import {
  DrizzleTransactionCategoryData,
  drizzleTransactionCategoryTable,
} from "../schemas/drizzle-transaction-category.schema";

@Injectable()
export class DrizzleTransactionCategoryRepository
  implements TransactionCategoryRepository
{
  constructor(private readonly drizzle: DrizzleService) {}

  async createUnique(
    transactionCategory: TransactionCategory,
    { session }: { session: DrizzleSession } = { session: this.drizzle.client },
  ): Promise<void> {
    await session
      .insert(drizzleTransactionCategoryTable)
      .values(transactionCategory.getRawData());
  }

  async updateUnique(
    transactionCategory: TransactionCategory,
    data: TransactionCategoryDataUpdateInput,
  ): Promise<void> {
    const updatedTransactionCategoryFields = transactionCategory.update(data);

    await this.drizzle.client
      .update(drizzleTransactionCategoryTable)
      .set(updatedTransactionCategoryFields)
      .where(sql`id = ${transactionCategory.id.value}`);
  }

  async findUniqueExpenseByNameFromUser(
    name: string,
    user: User,
  ): Promise<TransactionCategory | null> {
    const query = sql`
      SELECT
        *
      FROM
        transaction_categories
      WHERE
        user_id = ${user.id.value}
      AND
        transaction_type = 'EXPENSE'
      AND
        LOWER(name) = ${name.toLowerCase()}
      LIMIT 1
    `;
    const [transactionCategoryOnDatabase] =
      await this.drizzle.executeToGet<DrizzleTransactionCategoryData>(query);

    if (!transactionCategoryOnDatabase) return null;

    return TransactionCategoryEntity.create(transactionCategoryOnDatabase);
  }
}
