import {
  TransactionRecurrenceInstallment,
  TransactionRecurrenceInstallmentEntity,
} from "@/domain/entities/transaction-recurrence-installment.entity";
import {
  DrizzleTransactionRecurrenceData,
  DrizzleTransactionRecurrenceDataCreate,
} from "../schemas/drizzle-transaction-recurrence.schema";

export class DrizzleTransactionRecurrenceInstallmentMapper {
  static toDomain(
    transactionRecurrenceInstallmentOnDatabase: DrizzleTransactionRecurrenceData,
  ): TransactionRecurrenceInstallment {
    return TransactionRecurrenceInstallmentEntity.create({
      id: transactionRecurrenceInstallmentOnDatabase.id,
      period: transactionRecurrenceInstallmentOnDatabase.period,
      installments: transactionRecurrenceInstallmentOnDatabase.installments!,
    });
  }

  static toDrizzle(
    transactionRecurrenceInstallment: TransactionRecurrenceInstallment,
  ): DrizzleTransactionRecurrenceDataCreate {
    return {
      ...transactionRecurrenceInstallment.getRawData(),
      type: "INSTALLMENT",
    };
  }
}
