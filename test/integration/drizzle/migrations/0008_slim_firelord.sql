CREATE TYPE "transaction_category_types" AS ENUM('EXPENSE', 'EARNING');--> statement-breakpoint
CREATE TYPE "transaction_recurrence_periods" AS ENUM('YEAR', 'MONTH', 'WEEK');--> statement-breakpoint
CREATE TYPE "transaction_recurrence_types" AS ENUM('INSTALLMENT', 'FIXED');--> statement-breakpoint
CREATE TYPE "transaction_types" AS ENUM('DEBIT_EXPENSE', 'CREDIT_EXPENSE', 'EARNING', 'TRANSFERENCE');--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "transaction_debit_expenses" (
	"transaction_id" uuid PRIMARY KEY NOT NULL,
	"bank_account_id" uuid,
	"transaction_category_id" uuid,
	"accomplished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transaction_recurrences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" "transaction_recurrence_types" NOT NULL,
	"period" "transaction_recurrence_periods" NOT NULL,
	"installments" integer,
	"interval" integer,
	"occurrences" integer[],
	CONSTRAINT "type_constraint" CHECK (
        (
          "transaction_recurrences"."type" = 'INSTALLMENT' 
        AND 
          "transaction_recurrences"."installments" IS NOT NULL
        AND 
          "transaction_recurrences"."interval" IS NULL
        AND 
          "transaction_recurrences"."occurrences" IS NULL
        ) 
        OR (
          "transaction_recurrences"."type" = 'FIXED'
        AND 
          "transaction_recurrences"."installments" IS NULL
        AND 
          "transaction_recurrences"."interval" IS NOT NULL
        AND 
          "transaction_recurrences"."occurrences" IS NOT NULL
        )
      )
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"type" "transaction_types",
	"transaction_recurrence_id" uuid,
	"transacted_at" timestamp with time zone NOT NULL,
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
 ALTER TABLE "transaction_debit_expenses" ADD CONSTRAINT "transaction_debit_expenses_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_debit_expenses" ADD CONSTRAINT "transaction_debit_expenses_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transaction_debit_expenses" ADD CONSTRAINT "transaction_debit_expenses_transaction_category_id_transaction_categories_id_fk" FOREIGN KEY ("transaction_category_id") REFERENCES "transaction_categories"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transaction_recurrence_id_transaction_recurrences_id_fk" FOREIGN KEY ("transaction_recurrence_id") REFERENCES "transaction_recurrences"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
