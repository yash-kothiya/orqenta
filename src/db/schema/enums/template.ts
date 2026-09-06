import { pgEnum } from "drizzle-orm/pg-core";

export const templateTypeEnum = pgEnum("template_type", [
  "builtin",
  "local",
  "remote",
]);
