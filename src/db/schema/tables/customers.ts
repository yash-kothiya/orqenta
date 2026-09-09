import { index, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";

export const customers = pgTable(
  "customers",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("cus")),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    city: text("city"),
    postalCode: text("postal_code"),
    countryCode: text("country_code"), // ISO 3166-1 alpha-2
    taxId: text("tax_id"),
    /** Permanent sequential number, assigned at creation — {CNUM} in §4.4. */
    customerNumber: integer("customer_number"),
    ...timestamps,
  },
  (table) => [
    index("customers_name_idx").on(table.name),
    index("customers_customer_number_idx").on(table.customerNumber),
  ],
);
