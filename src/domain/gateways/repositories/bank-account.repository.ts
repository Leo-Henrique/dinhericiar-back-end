import {
  BankAccount,
  BankAccountDataUpdateInput,
} from "@/domain/entities/bank-account.entity";
import { User } from "@/domain/entities/user.entity";

export abstract class BankAccountRepository {
  abstract createUnique(bankAccount: BankAccount): Promise<void>;
  abstract updateUnique(
    bankAccount: BankAccount,
    data: BankAccountDataUpdateInput,
  ): Promise<void>;
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
}
