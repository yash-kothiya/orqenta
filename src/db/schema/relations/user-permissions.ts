import { relations } from "drizzle-orm";
import { userPermissions, users } from "../tables";

export const userPermissionsRelations = relations(
  userPermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [userPermissions.userId],
      references: [users.id],
    }),
  }),
);
