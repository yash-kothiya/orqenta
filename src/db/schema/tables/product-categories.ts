import {
  boolean,
  integer,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";

export const productCategories = pgTable(
  "product_categories",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("pcat")),
    code: text("code").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isBuiltin: boolean("is_builtin").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("product_categories_code_unique").on(table.code)],
);
