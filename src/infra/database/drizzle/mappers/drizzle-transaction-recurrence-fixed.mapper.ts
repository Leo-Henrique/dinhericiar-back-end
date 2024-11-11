import {
  TransactionRecurrenceFixed,
  TransactionRecurrenceFixedEntity,
} from "@/domain/entities/transaction-recurrence-fixed.entity";
import {
  DrizzleTransactionRecurrenceData,
  DrizzleTransactionRecurrenceDataCreate,
} from "../schemas/drizzle-transaction-recurrence.schema";

export class DrizzleTransactionRecurrenceFixedMapper {
  static toDomain(
    transactionRecurrenceFixedOnDatabase: DrizzleTransactionRecurrenceData,
  ): TransactionRecurrenceFixed {
    return TransactionRecurrenceFixedEntity.create({
      id: transactionRecurrenceFixedOnDatabase.id,
      period: transactionRecurrenceFixedOnDatabase.period,
      interval: transactionRecurrenceFixedOnDatabase.interval!,
      occurrences: transactionRecurrenceFixedOnDatabase.occurrences,
    });
  }

  static toDrizzle(
    transactionRecurrenceFixed: TransactionRecurrenceFixed,
  ): DrizzleTransactionRecurrenceDataCreate {
    return {
      ...transactionRecurrenceFixed.getRawData(),
      type: "FIXED",
    };
  }
}
