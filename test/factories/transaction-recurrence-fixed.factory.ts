import { Factory } from "@/core/factory";
import {
  TransactionRecurrenceFixedDataCreateInput,
  TransactionRecurrenceFixedEntity,
} from "@/domain/entities/transaction-recurrence-fixed.entity";
import { DrizzleService } from "@/infra/database/drizzle/drizzle.service";
import { DrizzleTransactionRecurrenceFixedMapper } from "@/infra/database/drizzle/mappers/drizzle-transaction-recurrence-fixed.mapper";
import { drizzleTransactionRecurrenceTable } from "@/infra/database/drizzle/schemas/drizzle-transaction-recurrence.schema";
import { faker } from "@faker-js/faker";
import { Injectable } from "@nestjs/common";

export type TransactionRecurrenceFixedFactoryInput =
  Partial<TransactionRecurrenceFixedDataCreateInput>;

export type TransactionRecurrenceFixedFactoryOutput = ReturnType<
  TransactionRecurrenceFixedFactory["make"]
>;

@Injectable()
export class TransactionRecurrenceFixedFactory extends Factory<TransactionRecurrenceFixedFactoryInput> {
  constructor(private readonly drizzle?: DrizzleService) {
    super();
  }

  make(override: TransactionRecurrenceFixedFactoryInput = {}) {
    const input = {
      period: "MONTH",
      interval: faker.number.int({ min: 1, max: 10 }),
      occurrences: null,
      ...override,
    } satisfies TransactionRecurrenceFixedDataCreateInput;
    const entity = TransactionRecurrenceFixedEntity.create(input);

    return { input, entity };
  }

  async makeAndSaveUnique(
    override: TransactionRecurrenceFixedFactoryInput = {},
  ) {
    const transactionRecurrenceFixed = this.make(override);
    const drizzleTransactionRecurrenceFixedValues =
      DrizzleTransactionRecurrenceFixedMapper.toDrizzle(
        transactionRecurrenceFixed.entity,
      );

    await this.drizzle?.client
      .insert(drizzleTransactionRecurrenceTable)
      .values(drizzleTransactionRecurrenceFixedValues);

    return transactionRecurrenceFixed;
  }
}
