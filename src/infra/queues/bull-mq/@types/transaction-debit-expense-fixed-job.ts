import { TransactionDebitExpenseFixedJobRawData } from "@/domain/entities/queues/transaction-debit-expense-fixed-job.entity";
import { Job, Queue } from "bullmq";

type JobName = "fixed_transaction_debit_expense_job";

export type BullMqTransactionDebitExpenseFixedQueue = Queue<
  TransactionDebitExpenseFixedJobRawData,
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  JobName
>;

export type BullMqTransactionDebitExpenseFixedJob = Job<
  TransactionDebitExpenseFixedJobRawData,
  any, // eslint-disable-line @typescript-eslint/no-explicit-any
  JobName
>;
