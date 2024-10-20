CREATE TABLE IF NOT EXISTS "credit_cards" (
	"id" uuid PRIMARY KEY NOT NULL,
	"bank_account_id" uuid NOT NULL,
	"slug" varchar NOT NULL,
	"name" varchar NOT NULL,
	"limit" numeric(18, 2) NOT NULL,
	"invoice_closing_day" integer NOT NULL,
	"invoice_due_day" integer NOT NULL,
	"is_main_card" boolean NOT NULL,
	"updated_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_bank_account_id_bank_accounts_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
