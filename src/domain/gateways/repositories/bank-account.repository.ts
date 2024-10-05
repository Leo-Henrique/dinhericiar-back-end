import { BankAccount } from "@/domain/entities/bank-account.entity";
import { User } from "@/domain/entities/user.entity";

export abstract class BankAccountRepository {
  abstract createUnique(bankAccount: BankAccount): Promise<void>;
  abstract findUniqueFromUserByInstitution(
    user: User,
    institution: string,
  ): Promise<BankAccount | null>;
  abstract findUniqueFromUserByName(
    user: User,
    name: string,
  ): Promise<BankAccount | null>;
  abstract findUniqueMainFromUser(user: User): Promise<BankAccount | null>;
}
