CREATE TABLE IF NOT EXISTS "bank_accounts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"slug" varchar NOT NULL,
	"institution" varchar NOT NULL,
	"name" varchar NOT NULL,
	"balance" numeric(18, 2) NOT NULL,
	"is_main_account" boolean NOT NULL,
	"inactivated_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "bank_accounts_user_id_slug_unique" UNIQUE("user_id","slug"),
	CONSTRAINT "bank_accounts_user_id_institution_unique" UNIQUE("user_id","institution"),
	CONSTRAINT "bank_accounts_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
