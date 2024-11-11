import { TransactionDebitExpenseFixedJob } from "@/domain/entities/queues/transaction-debit-expense-fixed-job.entity";
import {
  TransactionDebitExpenseFixedJobCreateRepeatableOptions,
  TransactionDebitExpenseFixedJobRepository,
} from "@/domain/gateways/repositories/queues/transaction-debit-expense-job.repository";
import { InjectQueue } from "@nestjs/bullmq";
import { BullMqTransactionDebitExpenseFixedQueue } from "../@types/transaction-debit-expense-fixed-job";
import { BULL_MQ_TRANSACTION_QUEUE_NAME } from "../queue-names";

export class BullMqFixedTransactionDebitExpenseJobRepository
  implements TransactionDebitExpenseFixedJobRepository
{
  public constructor(
    @InjectQueue(BULL_MQ_TRANSACTION_QUEUE_NAME)
    private readonly transactionDebitExpenseFixedQueue: BullMqTransactionDebitExpenseFixedQueue,
  ) {}

  async createRepeatable(
    transactionDebitExpenseFixedJob: TransactionDebitExpenseFixedJob,
    {
      firstJobExecutionDate,
      executionIntervalInMillisecondsBetweenEachJob,
    }: TransactionDebitExpenseFixedJobCreateRepeatableOptions,
  ): Promise<void> {
    await this.transactionDebitExpenseFixedQueue.upsertJobScheduler(
      "fixed_transaction_debit_expense_job",
      {
        startDate: firstJobExecutionDate,
        every: executionIntervalInMillisecondsBetweenEachJob,
      },
      {
        data: transactionDebitExpenseFixedJob.getRawData(),
        opts: {
          repeatJobKey: transactionDebitExpenseFixedJob.id.value,
        },
      },
    );
  }
}
