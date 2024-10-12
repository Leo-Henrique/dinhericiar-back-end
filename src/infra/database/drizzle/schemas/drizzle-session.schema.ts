import { SessionData } from "@/domain/entities/session.entity";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import * as ddl from "drizzle-orm/pg-core";
import { drizzleUserTable } from "./drizzle-user.schema";

export type DrizzleSessionData = InferSelectModel<typeof drizzleSessionTable>;

export type DrizzleSessionDataCreate = InferInsertModel<
  typeof drizzleSessionTable
>;

export const drizzleSessionTable = ddl.pgTable("sessions", {
  userId: ddl
    .uuid("user_id")
    .notNull()
    .references(() => drizzleUserTable.id, {
      onUpdate: "cascade",
      onDelete: "cascade",
    }),
  token: ddl.text("token").unique().notNull(),
  expiresAt: ddl.timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: ddl.timestamp("updated_at", { withTimezone: true }),
  createdAt: ddl.timestamp("created_at", { withTimezone: true }).notNull(),
} satisfies Record<keyof SessionData, ddl.PgColumnBuilderBase>);
