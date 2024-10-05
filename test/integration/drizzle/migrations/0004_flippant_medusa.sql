ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_unique" UNIQUE("token");--> statement-breakpoint
ALTER TABLE "user_activation_tokens" ADD CONSTRAINT "user_activation_tokens_token_unique" UNIQUE("token");--> statement-breakpoint
ALTER TABLE "user_password_reset_tokens" ADD CONSTRAINT "user_password_reset_tokens_token_unique" UNIQUE("token");