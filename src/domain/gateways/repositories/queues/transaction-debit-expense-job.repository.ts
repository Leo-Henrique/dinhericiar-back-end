import { TransactionDebitExpenseFixedJob } from "@/domain/entities/queues/transaction-debit-expense-fixed-job.entity";

export abstract class TransactionDebitExpenseFixedJobRepository {
  abstract createRepeatable(
    transactionDebitExpenseFixedJob: TransactionDebitExpenseFixedJob,
    options: TransactionDebitExpenseFixedJobCreateRepeatableOptions,
  ): Promise<void>;
}

export type TransactionDebitExpenseFixedJobCreateRepeatableOptions = {
  firstJobExecutionDate: Date;
  executionIntervalInMillisecondsBetweenEachJob: number;
};
