import { PaginationParams } from "@/core/schemas/pagination-params";
import {
  BankAccount,
  BankAccountDataUpdateInput,
} from "@/domain/entities/bank-account.entity";
import { User } from "@/domain/entities/user.entity";
import { UnitOfWorkSessionOptions } from "../unit-of-work";

export abstract class BankAccountRepository {
  abstract createUnique(bankAccount: BankAccount): Promise<void>;
  abstract updateUnique(
    bankAccount: BankAccount,
    data: BankAccountDataUpdateInput,
  ): Promise<void>;
  abstract deleteUnique(bankAccount: BankAccount): Promise<void>;
  abstract findUniqueByInstitutionFromUser(
    institution: string,
    user: User,
  ): Promise<BankAccount | null>;
  abstract findUniqueByNameFromUser(
    name: string,
    user: User,
  ): Promise<BankAccount | null>;
  abstract findUniqueMainFromUser(user: User): Promise<BankAccount | null>;
  abstract findUniqueByIdFromUser(
    id: string,
    user: User,
  ): Promise<BankAccount | null>;
  abstract findUniqueBySlugFromUser(
    id: string,
    user: User,
  ): Promise<BankAccount | null>;
  abstract findManyFromUser(
    user: User,
    options: PaginationParams & UnitOfWorkSessionOptions,
  ): Promise<BankAccount[]>;
  abstract countAllFromUser(
    user: User,
    options?: UnitOfWorkSessionOptions,
  ): Promise<number>;
  abstract sumAllBalanceFromUser(
    user: User,
    options?: UnitOfWorkSessionOptions,
  ): Promise<number>;
}
