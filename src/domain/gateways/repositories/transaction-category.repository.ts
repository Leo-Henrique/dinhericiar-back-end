import {
  TransactionCategory,
  TransactionCategoryDataUpdateInput,
} from "@/domain/entities/transaction-category.entity";
import { User } from "@/domain/entities/user.entity";
import { UnitOfWorkSessionOptions } from "../unit-of-work";

export abstract class TransactionCategoryRepository {
  abstract createUnique(
    transactionCategory: TransactionCategory,
    options?: UnitOfWorkSessionOptions,
  ): Promise<void>;
  abstract updateUnique(
    transactionCategory: TransactionCategory,
    data: TransactionCategoryDataUpdateInput,
  ): Promise<void>;
  abstract findUniqueExpenseByNameFromUser(
    name: string,
    user: User,
  ): Promise<TransactionCategory | null>;
}
