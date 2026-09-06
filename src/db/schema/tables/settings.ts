import { pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "../../helper/timestamps-helper";

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  ...timestamps,
});
