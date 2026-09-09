import { relations } from "drizzle-orm";
import { userPermissions, users } from "../tables";

export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(userPermissions),
}));
