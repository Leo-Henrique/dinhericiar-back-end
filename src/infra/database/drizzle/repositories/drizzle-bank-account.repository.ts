import { Mapper } from "@/core/mapper";
import { PaginationParams } from "@/core/schemas/pagination-params";
import {
  BankAccount,
  BankAccountDataUpdateInput,
  BankAccountEntity,
} from "@/domain/entities/bank-account.entity";
import { User } from "@/domain/entities/user.entity";
import { BankAccountRepository } from "@/domain/gateways/repositories/bank-account.repository";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { DrizzleService, DrizzleSession } from "../drizzle.service";
import { DrizzleBankAccountData } from "../schemas/drizzle-bank-account.schema";

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
          ${bankAccount.updatedAt},
          ${bankAccount.createdAt}
        )
    `;

    await this.drizzle.client.execute(query);
  }

  async updateUnique(
    bankAccount: BankAccount,
    data: BankAccountDataUpdateInput,
  ): Promise<void> {
    const updatedBankAccountFields = bankAccount.update(data);
    const updatedBankAccountFieldNames = Object.keys(
      updatedBankAccountFields,
    ) as (keyof typeof updatedBankAccountFields)[];

    const query = sql`      
      UPDATE
        bank_accounts
      SET
    `;

    for (let i = 0; i < updatedBankAccountFieldNames.length; i++) {
      const fieldName = updatedBankAccountFieldNames[i];
      const value = updatedBankAccountFields[fieldName];

      query.append(sql`
        ${sql.identifier(Mapper.toSnakeCase(fieldName))} = ${value}
      `);

      if (i < updatedBankAccountFieldNames.length - 1) query.append(sql`,`);
    }

    query.append(sql` WHERE id = ${bankAccount.id.value}`);

    await this.drizzle.client.execute(query);
  }

  async deleteUnique(bankAccount: BankAccount): Promise<void> {
    const query = sql`
      DELETE FROM 
        bank_accounts
      WHERE
        id = ${bankAccount.id.value}
    `;

    await this.drizzle.client.execute(query);
  }

  async findUniqueByInstitutionFromUser(
    institution: string,
    user: User,
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

  async findUniqueByNameFromUser(
    name: string,
    user: User,
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

  async findUniqueByIdFromUser(
    id: string,
    user: User,
  ): Promise<BankAccount | null> {
    const query = sql`
      SELECT
        *
      FROM
        bank_accounts
      WHERE
        user_id = ${user.id.value}
      AND
        id = ${id}
      LIMIT 1
    `;
    const [bankAccountOnDatabase] =
      await this.drizzle.executeToGet<DrizzleBankAccountData>(query);

    if (!bankAccountOnDatabase) return null;

    return BankAccountEntity.create(bankAccountOnDatabase);
  }

  async findUniqueBySlugFromUser(
    slug: string,
    user: User,
  ): Promise<BankAccount | null> {
    const query = sql`
      SELECT
        *
      FROM
        bank_accounts
      WHERE
        user_id = ${user.id.value}
      AND
        slug = ${slug}
      LIMIT 1
    `;
    const [bankAccountOnDatabase] =
      await this.drizzle.executeToGet<DrizzleBankAccountData>(query);

    if (!bankAccountOnDatabase) return null;

    return BankAccountEntity.create(bankAccountOnDatabase);
  }

  async findManyFromUser(
    user: User,
    {
      itemsPerPage,
      page,
      session,
    }: PaginationParams & { session?: DrizzleSession },
  ): Promise<BankAccount[]> {
    session = session ?? this.drizzle.client;

    const query = sql`
      SELECT
        *
      FROM
        bank_accounts
      WHERE
        user_id = ${user.id.value}
      ORDER BY
        is_main_account DESC,
        created_at DESC
      LIMIT
        ${itemsPerPage}
      OFFSET
        ${itemsPerPage * (page - 1)}
    `;
    const bankAccountsOnDatabase =
      await this.drizzle.executeToGet<DrizzleBankAccountData>(query, {
        session,
      });

    return bankAccountsOnDatabase.map(
      BankAccountEntity.create.bind(BankAccountEntity),
    );
  }

  async countAllFromUser(
    user: User,
    { session }: { session: DrizzleSession } = { session: this.drizzle.client },
  ): Promise<number> {
    type Row = { totalBankAccounts: number };

    const query = sql`
      SELECT
        COUNT(*)::INTEGER AS total_bank_accounts
      FROM
        bank_accounts
      WHERE
        user_id = ${user.id.value}
    `;
    const [{ totalBankAccounts }] = await this.drizzle.executeToGet<Row>(
      query,
      { session },
    );

    return totalBankAccounts;
  }

  async sumAllBalanceFromUser(
    user: User,
    { session }: { session: DrizzleSession } = { session: this.drizzle.client },
  ): Promise<number> {
    type Row = { totalBalance: number };

    const query = sql`
      SELECT
        SUM(balance)::DECIMAL AS total_balance
      FROM
        bank_accounts
      WHERE
        user_id = ${user.id.value}
    `;
    const [{ totalBalance }] = await this.drizzle.executeToGet<Row>(query, {
      session,
    });

    return totalBalance;
  }
}
