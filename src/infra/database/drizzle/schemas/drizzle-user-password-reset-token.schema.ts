import { UserPasswordResetTokenData } from "@/domain/entities/user-password-reset-token.entity";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";
import { drizzleUserTable } from "./drizzle-user.schema";

export type DrizzleUserPasswordResetTokenData = InferSelectModel<
  typeof drizzleUserPasswordResetTokenTable
>;

export type DrizzleUserPasswordResetTokenDataCreate = InferInsertModel<
  typeof drizzleUserPasswordResetTokenTable
>;

export const drizzleUserPasswordResetTokenTable = ddl.pgTable(
  "user_password_reset_tokens",
  {
    userId: ddl
      .uuid("user_id")
      .notNull()
      .references(() => drizzleUserTable.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    token: ddl.text("token").unique().notNull(),
    expiresAt: ddl.timestamp("expires_at", { withTimezone: true }).notNull(),
  } satisfies Record<keyof UserPasswordResetTokenData, ddl.PgColumnBuilderBase>,
);
