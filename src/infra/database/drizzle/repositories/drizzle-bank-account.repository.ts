import {
  BankAccount,
  BankAccountEntity,
} from "@/domain/entities/bank-account.entity";
import { User } from "@/domain/entities/user.entity";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService } from "../drizzle.service";
import { DrizzleBankAccountData } from "../schemas/bank-account.schema";

@Injectable()
export class DrizzleBankAccountRepository implements BankAccountRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async createUnique(bankAccount: BankAccount): Promise<void> {
    const query = sql`
      INSERT INTO bank_accounts 
        (
          id,
          user_id,
          slug,
          institution,
          name,
          balance,
          is_main_account,
          inactivated_at,
          updated_at,
          created_at
        )
      VALUES
        (
          ${bankAccount.id.value},
          ${bankAccount.userId.value},
          ${bankAccount.slug.value},
          ${bankAccount.institution.value},
          ${bankAccount.name.value},
          ${bankAccount.balance},
          ${bankAccount.isMainAccount},
          ${bankAccount.inactivatedAt},
          ${bankAccount.updatedAt},
          ${bankAccount.createdAt}
        )
    `;

    await this.drizzle.client.execute(query);
  }

  async findUniqueFromUserByInstitution(
    user: User,
    institution: string,
  ): Promise<BankAccount | null> {
    const query = sql`
      SELECT
        *
      FROM
        bank_accounts
      WHERE
        user_id = ${user.id.value}
      AND
        institution = ${institution}
      LIMIT 1
    `;
    const [bankAccountOnDatabase] =
      await this.drizzle.executeToGet<DrizzleBankAccountData>(query);

    if (!bankAccountOnDatabase) return null;

    return BankAccountEntity.create(bankAccountOnDatabase);
  }

  async findUniqueFromUserByName(
    user: User,
    name: string,
  ): Promise<BankAccount | null> {
    const query = sql`
      SELECT
        *
      FROM
        bank_accounts
      WHERE
        user_id = ${user.id.value}
      AND
        name = ${name}
      LIMIT 1
    `;
    const [bankAccountOnDatabase] =
      await this.drizzle.executeToGet<DrizzleBankAccountData>(query);

    if (!bankAccountOnDatabase) return null;

    return BankAccountEntity.create(bankAccountOnDatabase);
  }

  async findUniqueMainFromUser(user: User): Promise<BankAccount | null> {
    const query = sql`
      SELECT
        *
      FROM
        bank_accounts
      WHERE
        user_id = ${user.id.value}
      AND
        is_main_account = true
      LIMIT 1
    `;
    const [bankAccountOnDatabase] =
      await this.drizzle.executeToGet<DrizzleBankAccountData>(query);

    if (!bankAccountOnDatabase) return null;

    return BankAccountEntity.create(bankAccountOnDatabase);
  }
}
