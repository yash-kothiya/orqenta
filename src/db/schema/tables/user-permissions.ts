import { index, pgTable, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { permissionActionEnum, permissionResourceEnum } from "../enums";
import { users } from "./users";

export const userPermissions = pgTable(
  "user_permissions",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("perm")),
    userId: varchar("user_id", { length: 50 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resource: permissionResourceEnum("resource").notNull(),
    action: permissionActionEnum("action").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("user_permissions_user_id_resource_action_unique").on(
      table.userId,
      table.resource,
      table.action,
    ),
    index("user_permissions_user_id_idx").on(table.userId),
  ],
);
