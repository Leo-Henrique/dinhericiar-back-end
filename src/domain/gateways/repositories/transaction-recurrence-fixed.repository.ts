import { TransactionRecurrenceFixed } from "@/domain/entities/transaction-recurrence-fixed.entity";

export abstract class TransactionRecurrenceFixedRepository {
  abstract findUniqueById(
    id: string,
  ): Promise<TransactionRecurrenceFixed | null>;
}
