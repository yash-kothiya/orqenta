import { boolean, index, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { templateTypeEnum } from "../enums";

export const templates = pgTable(
  "templates",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("tpl")),
    name: text("name").notNull(),
    /** §11 — an HTML document with {{token}} placeholders. */
    html: text("html").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    templateType: templateTypeEnum("template_type")
      .notNull()
      .default("builtin"),
    ...timestamps,
  },
  (table) => [index("templates_is_default_idx").on(table.isDefault)],
);
