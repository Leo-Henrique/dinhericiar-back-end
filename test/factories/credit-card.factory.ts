import { ArrayWithExactLength } from "@/core/@types/array-with-exact-length";
import { Factory } from "@/core/factory";
import {
  CreditCardDataCreateInput,
  CreditCardEntity,
} from "@/domain/entities/credit-card.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { drizzleCreditCardTable } from "@/infra/database/drizzle/schemas/drizzle-credit-card.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

export type CreditCardFactoryInput = Partial<CreditCardDataCreateInput>;

export type CreditCardFactoryOutput = ReturnType<CreditCardFactory["make"]>;

@Injectable()
export class CreditCardFactory extends Factory<CreditCardFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: CreditCardFactoryInput = {}) {
    const input = {
      bankAccountId: faker.string.uuid(),
      name: faker.lorem.sentence(),
      limit: faker.number.float({ fractionDigits: 2 }),
      invoiceClosingDay: faker.number.int({ min: 1, max: 31 }),
      invoiceDueDay: faker.number.int({ min: 1, max: 31 }),
      ...override,
    } satisfies CreditCardDataCreateInput;
    const entity = CreditCardEntity.create(input);

    return { input, entity };
  }

  async makeAndSaveUnique(override: CreditCardFactoryInput = {}) {
    const creditCard = this.make(override);

    await this.drizzle?.client
      .insert(drizzleCreditCardTable)
      .values(creditCard.entity.getRawData());

    return creditCard;
  }

  async makeAndSaveMany(overrides: CreditCardFactoryInput[] = [{}]) {
    const creditCards = overrides?.map(this.make);

    await this.drizzle?.client
      ?.insert(drizzleCreditCardTable)
      .values(creditCards.map(creditCard => creditCard.entity.getRawData()));

    return creditCards;
  }

  async makeAndSaveManyByAmount<Amount extends number>(
    amount: Amount = 1 as Amount,
    override: CreditCardFactoryInput = {},
  ) {
    return this.makeAndSaveMany(
      Array.from({ length: amount }).map(() => override),
    ) as ArrayWithExactLength<Amount, CreditCardFactoryOutput>;
  }
}
