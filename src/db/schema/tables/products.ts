import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { taxDefinitions } from "./tax-definitions";

export const products = pgTable(
  "products",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("prod")),
    name: text("name").notNull(),
    description: text("description"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    sku: text("sku"),
    unit: text("unit").default("piece"), // FK-by-code to product_units.code
    category: text("category"), // FK-by-code to product_categories.code
    taxDefinitionId: varchar("tax_definition_id", { length: 50 }).references(
      () => taxDefinitions.id,
    ),
    /** §4.7 — products are soft-deleted so historical invoices keep resolving. */
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("products_sku_idx").on(table.sku),
    index("products_is_active_idx").on(table.isActive),
    index("products_category_idx").on(table.category),
  ],
);
