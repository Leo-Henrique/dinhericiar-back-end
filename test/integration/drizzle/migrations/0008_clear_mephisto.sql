DO $$ BEGIN
 CREATE TYPE "transaction_category_types" AS ENUM('EXPENSE', 'EARNING');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transaction_recurrence_periods" AS ENUM('YEAR', 'MONTH', 'WEEK');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"transaction_type" "transaction_category_types" NOT NULL,
	"name" varchar NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "transaction_categories_user_id_transaction_type_name_unique" UNIQUE NULLS NOT DISTINCT("user_id","transaction_type","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bank_account_id" uuid,
	"transaction_category_id" uuid,
	"recurrence_origin_id" uuid,
	"recurrence_period" "transaction_recurrence_periods",
	"recurrence_interval" integer,
	"recurrence_limit" integer,
	"recurrence_occurrence" integer[],
	"transacted_at" timestamp with time zone NOT NULL,
	"accomplished_at" timestamp with time zone,
	"amount" numeric(18, 2) NOT NULL,
	"description" varchar NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_categories" ADD CONSTRAINT "transaction_categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transaction_category_id_transaction_categories_id_fk" FOREIGN KEY ("transaction_category_id") REFERENCES "transaction_categories"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurrence_origin_id_bank_accounts_id_fk" FOREIGN KEY ("recurrence_origin_id") REFERENCES "bank_accounts"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
