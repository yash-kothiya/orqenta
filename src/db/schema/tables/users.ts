import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("usr")),
    username: text("username").notNull(),
    email: text("email"),
    displayName: text("display_name"),
    passwordHash: text("password_hash").notNull(),
    /** An admin bypasses the per-resource checks in §5 entirely. */
    isAdmin: boolean("is_admin").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    index("users_is_active_idx").on(table.isActive),
  ],
);
