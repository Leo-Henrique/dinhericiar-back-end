ALTER TABLE "transaction_debit_expenses" ALTER COLUMN "bank_account_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction_debit_expenses" ALTER COLUMN "transaction_category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "created_by_queue" boolean NOT NULL;