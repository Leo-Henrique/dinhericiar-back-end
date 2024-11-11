import { Factory } from "@/core/factory";
import {
  TransactionDebitExpenseFixedJobDataCreateInput,
  TransactionDebitExpenseFixedJobEntity,
} from "@/domain/entities/queues/transaction-debit-expense-fixed-job.entity";
import { BullMqTransactionDebitExpenseFixedQueue } from "@/infra/queues/bull-mq/@types/transaction-debit-expense-fixed-job";
import { BULL_MQ_TRANSACTION_QUEUE_NAME } from "@/infra/queues/bull-mq/queue-names";

import { faker } from "@faker-js/faker";
import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";

export type TransactionDebitExpenseFixedJobFactoryInput =
  Partial<TransactionDebitExpenseFixedJobDataCreateInput>;

export type TransactionDebitExpenseFixedJobFactoryOutput = ReturnType<
  TransactionDebitExpenseFixedJobFactory["make"]
>;

@Injectable()
export class TransactionDebitExpenseFixedJobFactory extends Factory<TransactionDebitExpenseFixedJobFactoryInput> {
  constructor(
    @InjectQueue(BULL_MQ_TRANSACTION_QUEUE_NAME)
    private readonly transactionDebitExpenseFixedQueue: BullMqTransactionDebitExpenseFixedQueue,
  ) {
    super();
  }

  make(override: TransactionDebitExpenseFixedJobFactoryInput = {}) {
    const input = {
      bankAccountId: faker.string.uuid(),
      transactionCategoryId: faker.string.uuid(),
      transactionRecurrenceId: faker.string.uuid(),
      description: faker.lorem.sentence(),
      amount: faker.number.float({ min: 1, fractionDigits: 2 }),
      ...override,
    } satisfies TransactionDebitExpenseFixedJobDataCreateInput;
    const entity = TransactionDebitExpenseFixedJobEntity.create(input);

    return { input, entity };
  }

  async makeAndSaveUnique(
    override: TransactionDebitExpenseFixedJobFactoryInput = {},
  ) {
    const transactionDebitExpenseFixedJob = this.make(override);

    const transactionDebitExpenseFixedJobOnDatabase =
      await this.transactionDebitExpenseFixedQueue.add(
        "fixed_transaction_debit_expense_job",
        transactionDebitExpenseFixedJob.entity.getRawData(),
      );

    return {
      ...transactionDebitExpenseFixedJob,
      onDatabase: transactionDebitExpenseFixedJobOnDatabase,
    };
  }

  // async makeAndSaveMany(
  //   overrides: TransactionDebitExpenseFixedJobFactoryInput[] = [{}],
  // ) {
  //   const transactionDebitExpenseFixedJobs = overrides?.map(this.make);

  //   await this.drizzle?.client
  //     ?.insert(drizzleTransactionDebitExpenseFixedJobTable)
  //     .values(
  //       transactionDebitExpenseFixedJobs.map(transactionDebitExpenseFixedJob =>
  //         transactionDebitExpenseFixedJob.entity.getRawData(),
  //       ),
  //     );

  //   return transactionDebitExpenseFixedJobs;
  // }
}
