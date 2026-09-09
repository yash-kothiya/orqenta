import {
  boolean,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";

export const taxDefinitions = pgTable(
  "tax_definitions",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("tax")),
    code: text("code"),
    name: text("name"),
    percent: numeric("percent", { precision: 6, scale: 3 }).notNull(),
    categoryCode: text("category_code"), // UBL: S, Z, E, …
    countryCode: text("country_code"),
    vendorSpecificId: text("vendor_specific_id"),
    defaultIncluded: boolean("default_included").notNull().default(false),
    metadata: text("metadata"), // JSON string
    ...timestamps,
  },
  (table) => [uniqueIndex("tax_definitions_code_unique").on(table.code)],
);
