import { TransactionDebitExpenseFixedJobEntity } from "@/domain/entities/queues/transaction-debit-expense-fixed-job.entity";
import {
  CreateFixedTransactionDebitExpenseWorkerUseCase,
  CreateFixedTransactionDebitExpenseWorkerUseCaseOutput,
} from "@/domain/use-cases/queues/create-fixed-transaction-debit-expense.worker.use-case";
import { env } from "@/infra/env";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { BullMqTransactionDebitExpenseFixedJob } from "../@types/transaction-debit-expense-fixed-job";
import { BULL_MQ_TRANSACTION_QUEUE_NAME } from "../queue-names";

@Processor(BULL_MQ_TRANSACTION_QUEUE_NAME)
export class BullMqFixedTransactionDebitExpenseWorker extends WorkerHost {
  public constructor(
    private readonly createFixedTransactionDebitExpenseWorkerUseCase: CreateFixedTransactionDebitExpenseWorkerUseCase,
  ) {
    super();
  }

  async process(
    job: BullMqTransactionDebitExpenseFixedJob,
  ): Promise<CreateFixedTransactionDebitExpenseWorkerUseCaseOutput> {
    switch (job.name) {
      case "fixed_transaction_debit_expense_job": {
        const transactionDebitExpenseFixedJob =
          TransactionDebitExpenseFixedJobEntity.create(job.data);

        const worker =
          await this.createFixedTransactionDebitExpenseWorkerUseCase.execute({
            transactionDebitExpenseFixedJob,
          });

        if (worker.isLeft() && env.NODE_ENV === "production") {
          // TODO: observability
          console.error("Queue worker error:", worker.reason);
        }

        return worker;
      }
    }
  }
}
