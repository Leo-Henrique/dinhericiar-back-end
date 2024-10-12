import { ArrayWithExactLength } from "@/core/@types/array-with-exact-length";
import { Factory } from "@/core/factory";
import {
  BankAccountDataCreateInput,
  BankAccountEntity,
} from "@/domain/entities/bank-account.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { drizzleBankAccountTable } from "@/infra/database/drizzle/schemas/drizzle-bank-account.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

type BankAccountFactoryInput = Partial<BankAccountDataCreateInput>;

export type BankAccountFactoryOutput = ReturnType<BankAccountFactory["make"]>;

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

  async makeAndSaveUnique(override: BankAccountFactoryInput = {}) {
    const bankAccount = this.make(override);

    await this.drizzle?.client
      .insert(drizzleBankAccountTable)
      .values(bankAccount.entity.getRawData());

    return bankAccount;
  }

  async makeAndSaveMany(overrides: BankAccountFactoryInput[] = [{}]) {
    const bankAccounts = overrides?.map(this.make);

    await this.drizzle?.client
      ?.insert(drizzleBankAccountTable)
      .values(bankAccounts.map(bankAccount => bankAccount.entity.getRawData()));

    return bankAccounts;
  }

  async makeAndSaveManyByAmount<Amount extends number>(
    amount: Amount = 1 as Amount,
    override: BankAccountFactoryInput = {},
  ) {
    return this.makeAndSaveMany(
      Array.from({ length: amount }).map(() => override),
    ) as ArrayWithExactLength<Amount, BankAccountFactoryOutput>;
  }
}
