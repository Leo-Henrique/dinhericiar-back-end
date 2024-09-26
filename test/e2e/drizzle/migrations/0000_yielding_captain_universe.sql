CREATE TABLE IF NOT EXISTS "e2e"."user_activation_tokens" (
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "e2e"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password" varchar NOT NULL,
	"name" varchar NOT NULL,
	"activated_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "e2e"."user_activation_tokens" ADD CONSTRAINT "user_activation_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "e2e"."users"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
