import { TransactionDebitExpenseFixedJobRepository } from "@/domain/gateways/repositories/queues/transaction-debit-expense-job.repository";
import { CreateFixedTransactionDebitExpenseWorkerUseCase } from "@/domain/use-cases/queues/create-fixed-transaction-debit-expense.worker.use-case";
import { BullModule } from "@nestjs/bullmq";
import { DynamicModule, Module, Provider } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module";
import { BULL_MQ_TRANSACTION_QUEUE_NAME } from "./bull-mq/queue-names";
import { BullMqFixedTransactionDebitExpenseJobRepository } from "./bull-mq/repositories/bull-mq-transaction-debit-expense-fixed-job.repository";
import { BullMqFixedTransactionDebitExpenseWorker } from "./bull-mq/workers/bull-mq-transaction-debit-expense-fixed.worker";
import { redisClient } from "./redis/redis.service";

const queues = [
  BullModule.registerQueue({
    name: BULL_MQ_TRANSACTION_QUEUE_NAME,
  }),
] satisfies DynamicModule[];

const queuesProviders = [
  {
    provide: TransactionDebitExpenseFixedJobRepository,
    useClass: BullMqFixedTransactionDebitExpenseJobRepository,
  },
] satisfies Provider[];

@Module({
  imports: [
    DatabaseModule,
    BullModule.forRoot({ connection: redisClient }),
    ...queues,
  ],
  providers: [
    ...queuesProviders,
    CreateFixedTransactionDebitExpenseWorkerUseCase,
    BullMqFixedTransactionDebitExpenseWorker,
  ],
  exports: [...queues, ...queuesProviders.map(({ provide }) => provide)],
})
export class QueuesModule {}
