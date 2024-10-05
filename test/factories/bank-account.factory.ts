import { Factory } from "@/core/factory";
import {
  BankAccountDataCreateInput,
  BankAccountEntity,
} from "@/domain/entities/bank-account.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";

type BankAccountFactoryInput = Partial<BankAccountDataCreateInput>;

export type BankAccountFactoryMakeOutput = Awaited<
  ReturnType<BankAccountFactory["make"]>
>;

export type BankAccountFactoryMakeAndSaveOutput = Awaited<
  ReturnType<BankAccountFactory["makeAndSave"]>
>;

@Injectable()
export class BankAccountFactory extends Factory<BankAccountFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: BankAccountFactoryInput = {}) {
    const input = {
      userId: faker.string.uuid(),
      institution: faker.company.name(),
      name: faker.lorem.sentence(),
      balance: faker.number.float({ fractionDigits: 2 }),
      ...override,
    } satisfies BankAccountDataCreateInput;
    const entity = BankAccountEntity.create(input);

    return { input, entity };
  }

  async makeAndSave(override: BankAccountFactoryInput = {}) {
    const bankAccount = this.make(override);

    await this.drizzle?.client.execute(sql`
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
          ${bankAccount.entity.id.value},
          ${bankAccount.entity.userId.value},
          ${bankAccount.entity.slug.value},
          ${bankAccount.entity.institution.value},
          ${bankAccount.entity.name.value},
          ${bankAccount.entity.balance},
          ${bankAccount.entity.isMainAccount},
          ${bankAccount.entity.inactivatedAt},
          ${bankAccount.entity.updatedAt},
          ${bankAccount.entity.createdAt}
        )
    `);

    return bankAccount;
  }
}
