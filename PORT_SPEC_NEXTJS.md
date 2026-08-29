# Orqenta — Complete Build Spec

**Explicitly out of scope for this port** — do not build, stub, or leave hooks for any of these:

- Internationalization / translations / locale files. All UI strings are plain English literals; no `next-intl`, `i18next`, or `t()` helper anywhere.
- Two-factor authentication (TOTP, recovery codes, the Security settings panel).
- SMTP / sending invoices by email.
- OIDC / SSO login.

---

## 1. Directory layout

```
src/
  app/
    (auth)/login/page.tsx
    (app)/layout.tsx                  # navbar + breadcrumbs shell
    (app)/dashboard/page.tsx
    (app)/invoices/page.tsx
    (app)/invoices/new/page.tsx
    (app)/invoices/[id]/page.tsx
    (app)/invoices/[id]/edit/page.tsx
    (app)/customers/{page,new/page,[id]/page,[id]/edit/page}.tsx
    (app)/products/{page,new/page,[id]/page,[id]/edit/page}.tsx
    (app)/users/{page,new/page,[id]/page}.tsx
    (app)/templates/page.tsx
    (app)/settings/page.tsx           # ?section=… drives the panel
    public/invoices/[token]/page.tsx  # no auth, no app chrome
    api/invoices/[id]/html/route.ts   # rendered invoice HTML
    api/invoices/[id]/pdf/route.ts
    api/public/invoices/[token]/{html,pdf}/route.ts
  db/
    index.ts                          # drizzle client; export * from "./schema"
    seed.ts
    helper/
      id-generator.ts
      timestamps-helper.ts
    migrations/                       # drizzle-kit output — never hand-edited
      meta/
      0000_<name>.sql
    schema/
      index.ts                        # barrel: ./enums, ./tables, ./relations
      enums/
        index.ts                      # barrel
        invoice.ts                    # invoiceStatusEnum, roundingModeEnum
        template.ts                   # templateTypeEnum
        permission.ts                 # permissionResourceEnum, permissionActionEnum
      relations/
        index.ts                      # barrel
        customers.ts
        invoices.ts
        invoice-items.ts
        invoice-item-taxes.ts
        invoice-taxes.ts
        invoice-status-history.ts
        invoice-attachments.ts
        products.ts
        tax-definitions.ts
        users.ts
        user-permissions.ts
      tables/
        index.ts                      # barrel
        settings.ts
        customers.ts
        tax-definitions.ts
        product-categories.ts
        product-units.ts
        products.ts
        invoices.ts
        invoice-items.ts
        invoice-item-taxes.ts
        invoice-taxes.ts
        invoice-status-history.ts
        invoice-attachments.ts
        templates.ts
        users.ts
        user-permissions.ts
  actions/
    invoices.ts customers.ts products.ts settings.ts users.ts auth.ts
    taxDefinitions.ts productOptions.ts
  lib/
    auth.ts permissions.ts money.ts numbering.ts format.ts render.ts
    action-result.ts                  # ActionResult<T> + unwrap()
  components/
    query-provider.tsx                # QueryClientProvider, mounted in the root layout
    invoice-editor.tsx permissions-grid.tsx nav.tsx breadcrumbs.tsx
    theme-toggle.tsx status-badge.tsx
```

---

## 2. Drizzle schema (`src/db/`)

### 2.0 File layout & conventions

One table per file under `schema/tables/`. `index.ts` files are **barrel files only** — they re-export, they never declare anything.

```
src/db/
  index.ts                       # drizzle client; export * from "./schema"
  helper/
    id-generator.ts
    timestamps-helper.ts
  migrations/                    # drizzle-kit output — never hand-edited
    meta/
    0000_<name>.sql
  schema/
    index.ts                     # barrel: ./enums, ./tables, ./relations
    enums/
      index.ts                   # barrel
      invoice.ts                 # invoiceStatusEnum, roundingModeEnum
      template.ts                # templateTypeEnum
      permission.ts              # permissionResourceEnum, permissionActionEnum
    relations/
      index.ts                   # barrel
      *.ts                       # one file per table with relations (see §2.16)
    tables/
      index.ts                   # barrel: export * from "./customers"; … one line per file
      settings.ts
      customers.ts
      tax-definitions.ts
      product-categories.ts
      product-units.ts
      products.ts
      invoices.ts
      invoice-items.ts
      invoice-item-taxes.ts
      invoice-taxes.ts
      invoice-status-history.ts
      invoice-attachments.ts
      templates.ts
      users.ts
      user-permissions.ts
  seed.ts
```

Import paths that follow from this layout, used by every snippet below:

| From a file in          | Helpers                     | Enums      | Tables                       |
| ----------------------- | --------------------------- | ---------- | ---------------------------- |
| `schema/tables/*.ts`    | `../../helper/id-generator` | `../enums` | `./customers` (sibling file) |
| `schema/relations/*.ts` | —                           | `../enums` | `../tables` (barrel)         |

Always import a folder's barrel, never a leaf inside it — `../enums`, not `../enums/invoice`. Relation files must go through `../tables` rather than a sibling table file, otherwise the table↔relation imports go circular.

App code never imports a table file directly — it imports from `@/db` (or `@/db/schema`), which resolves through the barrels.

**`src/db/index.ts`**

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export const db = drizzle(pool, { schema });
export * from "./schema";
```

**`src/db/helper/id-generator.ts`**

```ts
import { v4 as uuidv4 } from "uuid";

export const generateId = (prefix: string): string => {
  return `${prefix}_${uuidv4()}`;
};
```

**`src/db/helper/timestamps-helper.ts`**

```ts
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
    precision: 3,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    precision: 3,
  })
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
};
```

**`drizzle.config.ts`** (repo root)

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

**Rules — apply to every table below:**

1. PK is always `varchar("id", { length: 50 }).primaryKey().$defaultFn(() => generateId("<prefix>"))`. Never `crypto.randomUUID()`, never `text` PKs. FK columns are `varchar(..., { length: 50 })` so they match. (`prefix_` + a 36-char uuid fits in 50.)
2. Timestamps come from the `...timestamps` spread, never declared inline.
3. Indexes are returned as an **array** from the second callback arg: `(table) => [ index(...), ... ]`. Index names are `<table>_<cols>_idx`; unique indexes `<table>_<cols>_unique`.
4. Enum columns use a `pgEnum` from `schema/enums/`, never `text({ enum: [...] })`.
5. Column names are snake_case in the DB, camelCase in TS.
6. Every new file added to `tables/`, `enums/` or `relations/` gets its export line in that folder barrel in the same commit.

**ID prefixes**

| Table              | Prefix  | Table                  | Prefix |
| ------------------ | ------- | ---------------------- | ------ |
| customers          | `cus`   | invoice_item_taxes     | `iit`  |
| tax_definitions    | `tax`   | invoice_taxes          | `itx`  |
| product_categories | `pcat`  | invoice_status_history | `ish`  |
| product_units      | `punit` | invoice_attachments    | `att`  |
| products           | `prod`  | templates              | `tpl`  |
| invoices           | `inv`   | users                  | `usr`  |
| invoice_items      | `item`  | user_permissions       | `perm` |

`settings` has no id — its PK is `key`.

### 2.1 `src/db/schema/enums/`

One file per domain, plus a barrel. Table files import from `../enums` and never reach into a leaf file.

**`enums/invoice.ts`**

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "complete",
  "paid",
  "overdue",
  "voided",
]);

export const roundingModeEnum = pgEnum("rounding_mode", ["line", "total"]);
```

**`enums/template.ts`**

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const templateTypeEnum = pgEnum("template_type", [
  "builtin",
  "local",
  "remote",
]);
```

**`enums/permission.ts`**

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export const permissionResourceEnum = pgEnum("permission_resource", [
  "invoices",
  "customers",
  "products",
  "templates",
  "settings",
  "tax_definitions",
  "users",
]);

export const permissionActionEnum = pgEnum("permission_action", [
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "void",
  "export",
  "install",
]);
```

**`enums/index.ts`**

```ts
export * from "./invoice";
export * from "./permission";
export * from "./template";
```

### 2.2 `settings.ts`

```ts
import { pgTable, text } from "drizzle-orm/pg-core";
import { timestamps } from "../../helper/timestamps-helper";

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  ...timestamps,
});
```

### 2.3 `customers.ts`

```ts
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
    customerNumber: integer("customer_number"), // permanent sequential no., assigned at creation
    ...timestamps,
  },
  (table) => [
    index("customers_name_idx").on(table.name),
    index("customers_customer_number_idx").on(table.customerNumber),
  ],
);
```

### 2.4 `tax-definitions.ts`

```ts
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
```

### 2.5 `product-categories.ts` / `product-units.ts`

Identical shape, two tables, two files.

```ts
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

export const productUnits = pgTable(
  "product_units",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("punit")),
    code: text("code").notNull(),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isBuiltin: boolean("is_builtin").notNull().default(false),
    ...timestamps,
  },
  (table) => [uniqueIndex("product_units_code_unique").on(table.code)],
);
```

### 2.6 `products.ts`

```ts
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
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("products_sku_idx").on(table.sku),
    index("products_is_active_idx").on(table.isActive),
    index("products_category_idx").on(table.category),
  ],
);
```

### 2.7 `invoices.ts`

```ts
import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoiceStatusEnum, roundingModeEnum } from "../enums";
import { customers } from "./customers";

export const invoices = pgTable(
  "invoices",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("inv")),
    invoiceNumber: text("invoice_number").notNull(),
    customerId: varchar("customer_id", { length: 50 }).references(
      () => customers.id,
    ),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date"),
    currency: text("currency").notNull().default("USD"),
    status: invoiceStatusEnum("status").notNull().default("draft"),

    subtotal: numeric("subtotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: numeric("discount_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    discountPercentage: numeric("discount_percentage", {
      precision: 6,
      scale: 3,
    })
      .notNull()
      .default("0"),
    taxRate: numeric("tax_rate", { precision: 6, scale: 3 })
      .notNull()
      .default("0"),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),

    pricesIncludeTax: boolean("prices_include_tax").notNull().default(false),
    roundingMode: roundingModeEnum("rounding_mode").notNull().default("line"),

    paymentTerms: text("payment_terms"),
    notes: text("notes"),

    shareToken: text("share_token").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("invoices_invoice_number_unique").on(table.invoiceNumber),
    uniqueIndex("invoices_share_token_unique").on(table.shareToken),
    index("invoices_customer_id_idx").on(table.customerId),
    index("invoices_status_idx").on(table.status),
    index("invoices_status_due_date_idx").on(table.status, table.dueDate),
    index("invoices_issue_date_idx").on(table.issueDate),
  ],
);
```

### 2.8 `invoice-items.ts`

```ts
import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoices } from "./invoices";
import { products } from "./products";

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("item")),
    invoiceId: varchar("invoice_id", { length: 50 })
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    productId: varchar("product_id", { length: 50 }).references(
      () => products.id,
    ),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 14, scale: 4 }).notNull(),
    unit: text("unit"),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
    lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("invoice_items_invoice_id_sort_order_idx").on(
      table.invoiceId,
      table.sortOrder,
    ),
    index("invoice_items_product_id_idx").on(table.productId),
  ],
);
```

### 2.9 `invoice-item-taxes.ts`

```ts
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoiceItems } from "./invoice-items";
import { taxDefinitions } from "./tax-definitions";

export const invoiceItemTaxes = pgTable(
  "invoice_item_taxes",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("iit")),
    invoiceItemId: varchar("invoice_item_id", { length: 50 })
      .notNull()
      .references(() => invoiceItems.id, { onDelete: "cascade" }),
    taxDefinitionId: varchar("tax_definition_id", { length: 50 }).references(
      () => taxDefinitions.id,
    ),
    percent: numeric("percent", { precision: 6, scale: 3 }).notNull(),
    taxableAmount: numeric("taxable_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    included: boolean("included").notNull().default(false),
    sequence: integer("sequence").notNull().default(0),
    note: text("note"),
    ...timestamps,
  },
  (table) => [
    index("invoice_item_taxes_invoice_item_id_idx").on(table.invoiceItemId),
  ],
);
```

### 2.10 `invoice-taxes.ts`

Invoice-level tax summary rows, one per distinct rate.

```ts
import { index, numeric, pgTable, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoices } from "./invoices";
import { taxDefinitions } from "./tax-definitions";

export const invoiceTaxes = pgTable(
  "invoice_taxes",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("itx")),
    invoiceId: varchar("invoice_id", { length: 50 })
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    taxDefinitionId: varchar("tax_definition_id", { length: 50 }).references(
      () => taxDefinitions.id,
    ),
    percent: numeric("percent", { precision: 6, scale: 3 }).notNull(),
    taxableAmount: numeric("taxable_amount", {
      precision: 14,
      scale: 2,
    }).notNull(),
    taxAmount: numeric("tax_amount", { precision: 14, scale: 2 }).notNull(),
    ...timestamps,
  },
  (table) => [index("invoice_taxes_invoice_id_idx").on(table.invoiceId)],
);
```

### 2.11 `invoice-status-history.ts`

Append-only audit trail of status transitions.

```ts
import { index, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoiceStatusEnum } from "../enums";
import { invoices } from "./invoices";

export const invoiceStatusHistory = pgTable(
  "invoice_status_history",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("ish")),
    invoiceId: varchar("invoice_id", { length: 50 })
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    status: invoiceStatusEnum("status").notNull(),
    paymentMethod: text("payment_method"),
    note: text("note"),
    ...timestamps,
  },
  (table) => [
    index("invoice_status_history_invoice_id_created_at_idx").on(
      table.invoiceId,
      table.createdAt,
    ),
  ],
);
```

> The original column is `changed_at`; here it is the `createdAt` from `timestamps`. Order history by `createdAt` and never update these rows.

### 2.12 `invoice-attachments.ts`

```ts
import { index, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";
import { invoices } from "./invoices";

export const invoiceAttachments = pgTable(
  "invoice_attachments",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("att")),
    invoiceId: varchar("invoice_id", { length: 50 })
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size"),
    mimeType: text("mime_type"),
    ...timestamps,
  },
  (table) => [index("invoice_attachments_invoice_id_idx").on(table.invoiceId)],
);
```

### 2.13 `templates.ts`

```ts
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
    html: text("html").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    templateType: templateTypeEnum("template_type")
      .notNull()
      .default("builtin"),
    ...timestamps,
  },
  (table) => [index("templates_is_default_idx").on(table.isDefault)],
);
```

### 2.14 `users.ts`

```ts
import {
  boolean,
  index,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { generateId } from "../../helper/id-generator";
import { timestamps } from "../../helper/timestamps-helper";

export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 50 })
      .primaryKey()
      .$defaultFn(() => generateId("usr")),
    username: text("username").notNull(),
    email: text("email"),
    displayName: text("display_name"),
    passwordHash: text("password_hash").notNull(),
    isAdmin: boolean("is_admin").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_username_unique").on(table.username),
    index("users_is_active_idx").on(table.isActive),
  ],
);
```

### 2.15 `user-permissions.ts`

```ts
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
```

### 2.16 `src/db/schema/relations/`

One file per table that has relations, named after the table file, plus a barrel. Relation files import tables from `../tables` (the barrel) — never from a table file directly, or the circular import bites.

**`relations/invoices.ts`**

```ts
import { relations } from "drizzle-orm";
import {
  customers,
  invoiceAttachments,
  invoiceItems,
  invoiceStatusHistory,
  invoiceTaxes,
  invoices,
} from "../tables";

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  taxes: many(invoiceTaxes),
  statusHistory: many(invoiceStatusHistory),
  attachments: many(invoiceAttachments),
}));
```

**`relations/invoice-items.ts`**

```ts
import { relations } from "drizzle-orm";
import { invoiceItemTaxes, invoiceItems, invoices, products } from "../tables";

export const invoiceItemsRelations = relations(
  invoiceItems,
  ({ one, many }) => ({
    invoice: one(invoices, {
      fields: [invoiceItems.invoiceId],
      references: [invoices.id],
    }),
    product: one(products, {
      fields: [invoiceItems.productId],
      references: [products.id],
    }),
    taxes: many(invoiceItemTaxes),
  }),
);
```

Same pattern, one file each:

| File                        | Relations                                                        |
| --------------------------- | ---------------------------------------------------------------- |
| `customers.ts`              | `many(invoices)`                                                 |
| `products.ts`               | `one(taxDefinitions)`, `many(invoiceItems)`                      |
| `tax-definitions.ts`        | `many(products)`, `many(invoiceItemTaxes)`, `many(invoiceTaxes)` |
| `invoice-item-taxes.ts`     | `one(invoiceItems)`, `one(taxDefinitions)`                       |
| `invoice-taxes.ts`          | `one(invoices)`, `one(taxDefinitions)`                           |
| `invoice-status-history.ts` | `one(invoices)`                                                  |
| `invoice-attachments.ts`    | `one(invoices)`                                                  |
| `users.ts`                  | `many(userPermissions)`                                          |
| `user-permissions.ts`       | `one(users)`                                                     |

**`relations/index.ts`**

```ts
export * from "./customers";
export * from "./invoice-attachments";
export * from "./invoice-item-taxes";
export * from "./invoice-items";
export * from "./invoice-status-history";
export * from "./invoice-taxes";
export * from "./invoices";
export * from "./products";
export * from "./tax-definitions";
export * from "./user-permissions";
export * from "./users";
```

---

## 3. Domain types (`src/lib/types.ts`)

```ts
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "complete"
  | "paid"
  | "overdue"
  | "voided";
export type RoundingMode = "line" | "total";
export type TaxMode = "invoice" | "line";

export const RESOURCES = [
  "invoices",
  "customers",
  "products",
  "templates",
  "settings",
  "tax_definitions",
  "users",
] as const;
export const ACTIONS = [
  "read",
  "create",
  "update",
  "delete",
  "publish",
  "void",
  "export",
  "install",
] as const;
export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

/** Which actions are meaningful per resource — drives the permissions grid columns. */
export const RESOURCE_ACTIONS: Record<Resource, readonly Action[]> = {
  invoices: ["read", "create", "update", "delete", "publish", "void", "export"],
  customers: ["read", "create", "update", "delete"],
  products: ["read", "create", "update", "delete"],
  templates: ["read", "create", "update", "delete", "install"],
  settings: ["read", "update"],
  tax_definitions: ["read", "create", "update", "delete"],
  users: ["read", "create", "update", "delete"],
};

export interface SessionUser {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  isAdmin: boolean;
  isActive: boolean;
  permissions: { resource: Resource; action: Action }[];
}

export function hasPermission(u: SessionUser | null, r: string, a: string) {
  if (!u) return false;
  if (u.isAdmin) return true; // admins bypass every check
  return u.permissions.some((p) => p.resource === r && p.action === a);
}
```

`InvoiceWithDetails = Invoice & { customer, items: (Item & {taxes})[], taxes, statusHistory, paidWith? }`.

---

## 4. Business logic — port these algorithms exactly

### 4.1 `r2` rounding

`const r2 = (n: number) => Math.round(n * 100) / 100;` — applied at every intermediate step below. Do not simplify.

### 4.2 Single-rate totals (`calculateInvoiceTotals`)

Inputs: `items[{quantity, unitPrice}]`, `discountPercentage`, `discountAmount`, `taxRate`, `pricesIncludeTax`, `roundingMode`.

```
rate = max(0, taxRate) / 100
lineGrosses[i] = quantity[i] * unitPrice[i]
subtotal = Σ lineGrosses

finalDiscount = discountAmount
if discountPercentage > 0: finalDiscount = subtotal * discountPercentage/100
finalDiscount = clamp(finalDiscount, 0, subtotal)

IF roundingMode === "line" AND subtotal > 0:
  # distribute the discount proportionally, last line absorbs the remainder
  distributed = 0
  for i in lines:
     if i is last:  lineDiscount = r2(finalDiscount - distributed)
     else:          lineDiscount = r2(finalDiscount * lineGross[i]/subtotal); distributed += lineDiscount
  sumTax = 0; sumTotal = 0
  for each line:
     afterDiscount = max(0, lineGross - lineDiscount)
     if pricesIncludeTax:
        net = rate>0 ? afterDiscount/(1+rate) : afterDiscount
        sumTax   += r2(afterDiscount - net)
        sumTotal += r2(afterDiscount)
     else:
        tax = r2(afterDiscount * rate)
        sumTax   += tax
        sumTotal += r2(afterDiscount + tax)
  taxAmount = r2(sumTax); total = r2(sumTotal)
ELSE (roundingMode === "total"):
  afterDiscount = subtotal - finalDiscount
  if pricesIncludeTax:
     net = rate>0 ? afterDiscount/(1+rate) : afterDiscount
     taxAmount = r2(afterDiscount - net); total = r2(afterDiscount)
  else:
     taxAmount = r2(afterDiscount * rate); total = r2(afterDiscount + taxAmount)

return { subtotal: r2(subtotal), discountAmount: r2(finalDiscount), taxAmount, total }
```

### 4.3 Per-line totals (`calculatePerLineTotals`) — used when any item carries a `taxes[]` array

Same discount distribution as above (always proportional, last line absorbs remainder). Then per line:

```
afterDiscount = max(0, lineGross - lineDiscount)
rateSum = Σ(tax.percent)/100 over that line's taxes
net = pricesIncludeTax && rateSum>0 ? afterDiscount/(1+rateSum) : afterDiscount
for each tax on the line:
   amount = r2(net * tax.percent/100)
   accumulate into summaryMap keyed by r2(percent): { taxable += net, amount += amount } (each r2'd)
itemTaxSum = r2(Σ tax amounts)
if pricesIncludeTax: total += r2(afterDiscount);          taxAmount += itemTaxSum
else:                total += r2(net + itemTaxSum);       taxAmount += itemTaxSum
```

Returns `{subtotal, discountAmount, taxAmount, total, perItem[{taxable, taxes[]}], summary[{percent, taxable, amount}] sorted by percent asc}`. Persist `perItem` rows into `invoice_item_taxes` and `summary` rows into `invoice_taxes`.

### 4.4 Invoice numbering (`src/lib/numbering.ts`)

Settings consumed: `invoiceNumberPattern`, `invoiceNumberingEnabled`, `invoicePrefix` (default `INV`), `invoiceIncludeYear` (default `true`), `invoiceNumberPadding` (default `3`, clamped 2–8).

**Draft placeholder:** `DRAFT-` + 6 chars from alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` drawn with `crypto.getRandomValues` (ambiguous chars I/O/0/1 deliberately excluded).

**`getNextInvoiceNumber(customerId?)`:**

1. If a `invoiceNumberPattern` exists _and_ numbering is enabled:
   - Expand date/random tokens first: `{YYYY}` `{YY}` `{MM}` `{DD}` `{DATE}`(=YYYYMMDD) `{RAND4}`(4 random chars).
   - If the pattern contains none of `{SEQ}` `{CSEQ}` `{CNUM}` → return the expanded string.
   - **Resolve `{CNUM}` first** (the customer's permanent `customer_number`, zero-padded to 3; empty string if unknown). This ordering matters: `{SEQ}`/`{CSEQ}` scan existing invoice numbers using everything _before_ the token as a LIKE prefix, so that prefix must already be fully literal or the counter is permanently stuck at 1.
   - `{SEQ}` → `findMaxSequence(prefixBeforeToken) + 1`, padded to 3. Global across all customers.
   - `{CSEQ}` → `findMaxSequence(prefixBeforeToken, customerId) + 1`, padded to 3. Scoped to that customer's invoices.
2. Otherwise legacy mode: base = `` `${prefix}-${year}-` `` (or `` `${prefix}-` `` when `invoiceIncludeYear` is false), then `base + pad(findMaxSequence(base)+1, invoiceNumberPadding)`.

`findMaxSequence(likePrefix, customerId?)`: select `invoice_number` where it starts with `likePrefix` (optionally AND `customer_id = ?`), regex-match `^<escaped prefix>(\d+).*?$`, return the max captured integer, or 0.

**Assignment on create:** if the client supplied an `invoiceNumber`, verify uniqueness and reject with `"Invoice number already exists"` if taken. Otherwise, if the configured pattern contains `{SEQ}|{CSEQ}|{CNUM}`, allocate a real number now via `getNextInvoiceNumber(customerId)`; else assign a `DRAFT-XXXXXX` placeholder. `nextCustomerNumber` = `MAX(customer_number) + 1`, assigned at customer creation and never reused.

### 4.5 Status model

Statuses: `draft → sent → paid → complete`, plus `overdue` and `voided`.

- **`overdue` is derived, not stored as a transition:** when reading an invoice, if status is not `paid`/`complete`/`voided` and `dueDate < today` (date-only comparison), display it as overdue.
- **publish**: draft → `sent`, guarantees a `shareToken`, redirect to `/invoices/{id}?published=1` which shows a success banner with the public link, Copy-link, Open and Download-PDF buttons.
- **unpublish**: sent/overdue → back to `draft`.
- **mark-sent / mark-paid / mark-complete / void**: direct status writes. `mark-paid` optionally records a free-text `paymentMethod`.
- **duplicate**: deep-copies invoice + items into a new draft with a fresh number and share token, then redirects to the copy's **edit** page.
- Every status write appends a row to `invoice_status_history` (`status`, `changedAt`, optional `paymentMethod`, `note`).
- The invoice list's "Paid with" column reads the most recent `paid` history row's `paymentMethod` per invoice; the column is hidden entirely when no visible row has one.

### 4.6 Retention protection

Setting `allowProtectedInvoiceChanges` (default `"false"`). An invoice is _retention-protected_ when its status is `sent`, `paid`, `complete` or `overdue`.

- Edit allowed when: `perm(invoices,update)` AND (status is `draft` OR (`allowProtectedInvoiceChanges` AND status ≠ `voided`)).
- Delete allowed when: `perm(invoices,delete)` AND (status is `draft` OR `voided` OR (`allowProtectedInvoiceChanges` AND status ≠ `voided`)).
- When the override is on and the invoice is protected, the Edit link fires a `confirm()`: _"You are about to edit a sent/paid invoice. Ensure this is legally allowed in your jurisdiction. Continue?"_, and the edit page shows a persistent warning alert.
- Deleting a protected invoice confirms with: _"You are about to delete a sent/paid invoice. This may violate invoice retention laws and cannot be undone. Continue?"_

### 4.7 Products are soft-deleted

`deleteProduct` sets `is_active = false`. A separate **Reactivate** action flips it back. Inactive products are excluded from the invoice-editor dropdown but still render on historical invoices. `GET /products/:id/usage` equivalent → count of `invoice_items` referencing the product.

### 4.8 Postal/city formatting (`src/lib/format.ts`)

```ts
const CITY_FIRST = new Set(["US", "GB", "BR", "AU", "CA", "NZ", "IE", "MX"]);
export function formatPostalCityLine(
  city?,
  postalCode?,
  countryCode?,
  format?,
) {
  const place = city?.trim() ?? "",
    postal = postalCode?.trim() ?? "";
  if (!place && !postal) return "";
  if (!place) return postal;
  if (!postal) return place;
  if (format === "city-postal") return `${place} ${postal}`;
  if (format === "postal-city") return `${postal} ${place}`;
  return CITY_FIRST.has((countryCode ?? "").trim().toUpperCase())
    ? `${place} ${postal}`
    : `${postal} ${place}`;
}
```

Money formatting: `Intl.NumberFormat(numberFormat === "period" ? "de-DE" : "en-US", {style:"currency", currency})`, falling back to `` `${currency} ${n.toFixed(2)}` `` on throw. Date formatting honours the `dateFormat` setting: `YYYY-MM-DD` or `DD.MM.YYYY`.

---

## 5. Auth

- `POST` login server action: look up user by username → verify bcrypt hash → sign a JWT and set the session cookie.
- Cookie: name `invio_session`, `httpOnly`, `sameSite: "lax"`, `secure` from env, `maxAge` = `SESSION_TTL_SECONDS` (default 3600, clamp 300–43200).
- Login rate limiting: max 5 attempts per 15-minute window per username+IP; on limit return HTTP 429 with `retryAfter` seconds; UI shows _"Too many login attempts. Try again in N minute(s)."_
- Inactive users (`isActive = false`) cannot log in — error _"Account disabled or not found"_.
- Bootstrap: on first run, if the `users` table is empty, create an admin from `ADMIN_USER` / `ADMIN_PASS` env. The app refuses to boot if `ADMIN_USER`, `ADMIN_PASS` or `JWT_SECRET` are missing/empty.
- Every server action begins with `const user = await requireUser()` then `assertPermission(user, resource, action)`. `requireUser()` redirects to `/login` when there is no valid session; a permission failure comes back as an `ok: false` result (§6.1) so the UI can show the message. Admins bypass all permission checks.
- `/` redirects to `/dashboard` when authed, `/login` otherwise. `/public/invoices/[token]` is the only unauthenticated app page.

---

## 6. Data layer — server actions + TanStack Query

Server actions are the only data layer: no REST API, no JSON route handlers. (The `/api/**` routes in §11 render HTML and PDF, not data.) **Every client read and write goes through TanStack Query, with a server action as its `queryFn` / `mutationFn`.** No `fetch()` in a component, no `useEffect` data loading.

### 6.1 Action contract

Each action is a `"use server"` function that, in order: `const user = await requireUser()` → `assertPermission(user, resource, action)` → validates its input with zod → reads/writes through `db` → returns an `ActionResult`.

```ts
// src/lib/action-result.ts
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/** Use as `someAction(input).then(unwrap)` so TanStack Query sees a rejected promise. */
export function unwrap<T>(result: ActionResult<T>): T {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}
```

Actions **return** failures, never throw them — Next.js replaces a thrown error with a generic message in production, which would strip the zod, permission and retention messages the pages in §10 are specified to show. Authentication is the one exception: `requireUser()` calls `redirect()`.

Actions **do not call `revalidatePath()`**. Cache invalidation belongs to the client (§6.3). The exceptions are login and logout, which change the session cookie that the server-rendered shell depends on.

Signatures mirror the original endpoints one-for-one; every return type below is wrapped in `ActionResult<…>`:

| Action                                                                       | Permission           | Notes                                                               |
| ---------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| `listInvoices()`                                                             | invoices:read        | returns list with joined customer + derived `overdue` + `paidWith`  |
| `getInvoice(id)`                                                             | invoices:read        | with items, taxes, statusHistory, customer                          |
| `getNextInvoiceNumber(customerId?)`                                          | invoices:create      | preview for the editor; final number is always assigned server-side |
| `createInvoice(input)`                                                       | invoices:create      |                                                                     |
| `updateInvoice(id, input)`                                                   | invoices:update      | honours retention protection                                        |
| `deleteInvoice(id)`                                                          | invoices:delete      | honours retention protection                                        |
| `publishInvoice(id)` / `unpublishInvoice(id)`                                | invoices:publish     |                                                                     |
| `duplicateInvoice(id)`                                                       | invoices:create      |                                                                     |
| `voidInvoice(id)`                                                            | invoices:void        |                                                                     |
| `markInvoicePaid(id, paymentMethod?)` / `markSent` / `markComplete`          | invoices:update      |                                                                     |
| `list/get/create/update/deleteCustomer`                                      | customers:\*         |                                                                     |
| `list/get/create/update/delete/reactivateProduct`, `productUsage(id)`        | products:\*          | delete = soft delete                                                |
| `list/create/update/deleteTaxDefinition`                                     | tax_definitions:\*   |                                                                     |
| `list/create/update/deleteProductCategory`, same for units, plus `usage(id)` | products:\*          |                                                                     |
| `getSettings()` / `updateSettings(partial)` / `uploadLogo(file)`             | settings:read/update |                                                                     |
| `list/get/create/update/deleteUser`                                          | users:\*             |                                                                     |
| `getMe()`                                                                    | own account          |                                                                     |
| `list/install/upload/update/deleteTemplate`                                  | templates:\*         |                                                                     |

### 6.2 Provider and query keys

`<QueryProvider>` wraps the app in the **root** layout, inside `<ThemeProvider>`, so the public invoice page gets it too.

```tsx
// src/components/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

One client per component instance via `useState`, never a module-level singleton — a shared client would leak one user's data into another user's SSR render.

**Query keys** follow one convention. No key-factory file:

| Shape                    | Example                                   | Used by                                     |
| ------------------------ | ----------------------------------------- | ------------------------------------------- |
| `[resource]`             | `["invoices"]`                            | invalidation — matches every key beneath it |
| `[resource, "list"]`     | `["customers", "list"]`                   | list pages                                  |
| `[resource, id]`         | `["invoices", "inv_…"]`                   | detail pages                                |
| `[resource, "…", …args]` | `["invoices", "next-number", customerId]` | everything else                             |

`resource` is the §3 `Resource` string — `invoices`, `customers`, `products`, `templates`, `settings`, `tax_definitions`, `users` — plus `product_categories` and `product_units`.

### 6.3 Reads and writes

```tsx
const {
  data: invoices = [],
  isPending,
  error,
} = useQuery({
  queryKey: ["invoices", "list"],
  queryFn: () => listInvoices().then(unwrap),
});
```

```tsx
const qc = useQueryClient();
const { mutate, isPending, error } = useMutation({
  mutationFn: (input: CustomerInput) => createCustomer(input).then(unwrap),
  onSuccess: (customer) => {
    qc.invalidateQueries({ queryKey: ["customers"] });
    router.push(`/customers/${customer.id}`);
  },
});
```

Rules:

1. Invalidate at the **resource root** (`{ queryKey: ["customers"] }`), not at individual keys. Cross-resource effects invalidate both roots: every invoice mutation and status transition hits `["invoices"]`; `updateSettings` hits `["settings"]`; deleting or renaming a product category or unit hits `["product_categories"]` / `["product_units"]` **and** `["products"]`; `deleteTaxDefinition` hits `["tax_definitions"]` and `["products"]`; `install/upload/deleteTemplate` and a `templateId` settings change both hit `["templates"]` and `["settings"]`.
2. Nothing is optimistically updated. Invalidate-and-refetch is enough at this scale — add optimistic updates only where a specific interaction proves sluggish.
3. The mutation's `error.message` renders in the destructive alert each page in §10 already specifies; `fieldErrors` map onto the individual inputs.
4. `isPending` drives every "spinner while pending", disabled submit, and disabled action button in §10.
5. Login `onSuccess` calls `router.replace("/dashboard")` then `router.refresh()`. Logout calls `queryClient.clear()` before redirecting, so the next user starts with a cold cache.

### 6.4 Server components, client components, prefetching

Server components keep the work that needs the session: the `(app)` shell (nav, breadcrumbs, permission-gated links), the page-level permission empty states, `/public/invoices/[token]`, and the `/api/**` render routes. They call `requireUser()` and read the db directly — those reads do not go through TanStack Query.

So each `page.tsx` in §10 is a thin server component that resolves the user, gates on permission, and renders **one** client component that owns the queries, the mutations, and the local UI state — filter pills, sort direction, item drag-and-drop, the `?section=` settings panel.

Default loading state is a skeleton while `isPending`. Where the flash is worth removing — the dashboard and the invoice list — prefetch on the server and hydrate:

```tsx
const qc = new QueryClient();
await qc.prefetchQuery({
  queryKey: ["invoices", "list"],
  queryFn: () => listInvoices().then(unwrap),
});
return (
  <HydrationBoundary state={dehydrate(qc)}>
    <InvoiceList />
  </HydrationBoundary>
);
```

Per page, only where it earns it — not a blanket pattern.

**Settings normalization rules to preserve:** on read, alias `companyEmail→email`, `companyPhone→phone`, `companyTaxId→taxId`, `companyCountryCode→countryCode`, `logoUrl→logo` (and drop `logoUrl`); default `dateFormat="YYYY-MM-DD"`, `numberFormat="comma"`, `postalCityFormat="auto"`, `allowProtectedInvoiceChanges="false"`. On write, an explicit empty string for `companyTaxId`, `companyPhone`, `companyEmail`, `companyCountryCode`, `companyCity`, `companyPostalCode` **deletes** the key rather than storing `""`. A `data:image/…` logo value is written to disk/blob storage and replaced by its served path. Setting `templateId` also flips `templates.is_default`.

---

## 7. Settings keys (complete list)

| Key                                                                            | Default                                   | Section    |
| ------------------------------------------------------------------------------ | ----------------------------------------- | ---------- |
| `companyName`                                                                  | `Your Company`                            | Company    |
| `companyAddress`                                                               | `123 Business St, City, State 12345`      | Company    |
| `companyCity`                                                                  | —                                         | Company    |
| `companyPostalCode`                                                            | —                                         | Company    |
| `companyEmail`                                                                 | `contact@yourcompany.com`                 | Company    |
| `companyPhone`                                                                 | `+1 (555) 123-4567`                       | Company    |
| `companyTaxId`                                                                 | `TAX123456789`                            | Company    |
| `companyCountryCode`                                                           | `US`                                      | Company    |
| `currency`                                                                     | `USD`                                     | Company    |
| `logo`                                                                         | `""`                                      | Branding   |
| `templateId`                                                                   | `""`                                      | Branding   |
| `highlight`                                                                    | `#059669`                                 | Branding   |
| `dateFormat`                                                                   | `YYYY-MM-DD` \| `DD.MM.YYYY`              | Formatting |
| `numberFormat`                                                                 | `comma` (1,000.00) \| `period` (1.000,00) | Formatting |
| `postalCityFormat`                                                             | `auto` \| `postal-city` \| `city-postal`  | Formatting |
| `paymentMethods`                                                               | `Bank Transfer, PayPal, Credit Card`      | Payments   |
| `bankAccount`                                                                  | `Account: …, Routing: …`                  | Payments   |
| `paymentTerms`                                                                 | `Due in 30 days`                          | Payments   |
| `defaultNotes`                                                                 | `Thank you for your business!`            | Payments   |
| `allowProtectedInvoiceChanges`                                                 | `false`                                   | Payments   |
| `taxLabel`                                                                     | — (e.g. VAT / GST / Sales tax)            | Tax        |
| `defaultTaxRate`                                                               | `0`                                       | Tax        |
| `defaultPricesIncludeTax`                                                      | `false`                                   | Tax        |
| `defaultRoundingMode`                                                          | `line`                                    | Tax        |
| `invoiceNumberingEnabled`                                                      | `true`                                    | Numbering  |
| `invoiceNumberPattern`                                                         | `""`                                      | Numbering  |
| `invoicePrefix`                                                                | `INV`                                     | Numbering  |
| `invoiceIncludeYear`                                                           | `true`                                    | Numbering  |
| `invoiceNumberPadding`                                                         | `3`                                       | Numbering  |
| `xmlProfileId`                                                                 | `ubl21`                                   | XML Export |
| `embedXmlInPdf`                                                                | `false`                                   | XML Export |
| `embedXmlInHtml`                                                               | `false`                                   | XML Export |
| `peppolSellerEndpointId` / `…SchemeId` / `peppolBuyerEndpointId` / `…SchemeId` | `""`                                      | XML Export |

> The original also stored `locale`. **Omit it** — this port has no localization.

---

## 8. Seed data (`src/db/seed.ts`)

- Insert every default setting above (idempotent, `ON CONFLICT DO NOTHING`).
- `product_categories` (id = code, `isBuiltin: true`): `service`/Service (1), `goods`/Goods (2), `subscription`/Subscription (3), `other`/Other (4).
- `product_units` (id = code, `isBuiltin: true`): `piece`/Piece (1), `hour`/Hour (2), `day`/Day (3), `kg`/Kilogram (4), `m`/Meter (5), `lump_sum`/Lump Sum (6).
- Admin user from `ADMIN_USER`/`ADMIN_PASS` if `users` is empty.
- At least one built-in invoice template (see §11).

---

## 9. Layout & navigation

**App shell** (`(app)/layout.tsx`): full-height `bg-muted` page; sticky top navbar with bottom border, contents centered in a `container mx-auto`.

- Left: brand link to `/` — an inline SVG bookmark/receipt mark (24px, `currentColor`, stroke-width 41.67 on a 0 0 500 500 viewBox) followed by the word **Invio**.
- Right (desktop, `md:` and up): horizontal links — **Dashboard** (`LayoutDashboard`), **Invoices** (`ReceiptText`), **Customers** (`Users`), then a **More** dropdown (`Ellipsis`) containing **Products** (`Package`), **Settings** (`Settings`), **Users** (`UserCog`), **Logout** (`LogOut`).
- Right (mobile): a hamburger `DropdownMenu` with the same items flattened into one list.
- Every nav item is permission-gated: Invoices needs `invoices:read`, Customers `customers:read`, Products `products:read`, Settings `settings:read`, Users `users:read`. Dashboard and Logout are always shown to an authed user.
- Main content: `container mx-auto px-3 py-4 sm:px-4 sm:py-6`, widened to `max-w-screen-2xl` on pages that opt in (invoice editor pages).
- Breadcrumbs render above the page content for authed routes, derived from the pathname segments (ids replaced by the record's name where available).
- The `/public/invoices/[token]` route renders **without** navbar or breadcrumbs.

**Theme:** `next-themes` only — light and dark, nothing custom. Wrap the root layout in `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>`, add `suppressHydrationWarning` to `<html>`, and use the stock shadcn/ui token palette exactly as `npx shadcn init` writes it into `globals.css` (`:root` + `.dark`). Do not invent a brand palette, do not hand-write CSS variables, and do not port the original's `invio-dark` / `invio-light` themes.

The theme toggle is a `Button` with `Sun` / `Moon` from `lucide-react` calling `setTheme()`, rendered in the navbar and in the Appearance settings panel.

Font: **Inter** via `next/font/google`, with the system-ui fallback stack.

**Status badge colors** (one shared `<StatusBadge>` component): draft → muted/ghost, sent → info/blue, paid → success/green, complete → secondary, overdue → destructive/red, voided → neutral (warning tint on the detail page header).

---

## 10. Page-by-page spec

### 10.1 `/login`

Centered card (max-w-md) on a muted hero background. Heading **"Welcome to Invio"**.

- Fields: **Username** (text, autocomplete `username`, required), **Password** (password, autocomplete `current-password`, required). Submit **"Login"**, full width, spinner while pending.
- Errors render in a destructive alert above the form — the login mutation's `error.message`, including the rate-limit message.

### 10.2 `/dashboard`

Heading **"Dashboard"**. Permission-gated empty states first: if the user lacks `invoices:read` show a card with a `ShieldOff` icon, title _"Invoice data hidden"_, body _"You do not have permission to view invoices. Contact an administrator to request access."_ Same pattern for customers.

Then three stat rows of bordered cards:

1. `grid-cols-2 lg:grid-cols-4` — **Invoices** (count), **Customers** (count), **Open Invoices** (`sent + overdue`), **Version** (app version string). Value text `text-2xl font-extrabold sm:text-3xl`, label `text-xs opacity-70 sm:text-sm`.
2. `grid-cols-1 sm:grid-cols-3` — **Total Billed** (Σ all totals), **Outstanding** (Σ where status ∈ {sent, overdue}), **Paid** (Σ where status ∈ {paid, complete}). Currency-formatted.
3. `grid-cols-2 sm:grid-cols-6` — counts per status: **Draft, Sent, Complete, Paid, Overdue, Voided**. The Overdue value turns red when > 0.

Then **"Recent Invoices"** — the 5 most recently updated (sort by `updatedAt ?? issueDate` desc). Table columns: Invoice No (link to detail), Customer, Total, Status (badge, hidden below `sm` — the status shows as small text under the number instead), Issue Date (right-aligned).

### 10.3 `/invoices`

Header row: **"Invoices"** + primary **"Create Invoice"** button (`SquarePen`), full-width on mobile, shown only with `invoices:create`.

Filter bar in a bordered card: pill buttons **All · Sent · Draft · Complete · Paid · Voided**, the active one solid, the rest ghost.

Table, `whitespace-nowrap`, header row muted. Every header except "Paid with" is a click-to-sort button that toggles asc/desc and appends ▲/▼; sort keys: `invoiceNumber` (default, desc), `customer`, `total`, `status`, `issueDate`, `updatedAt`. Ties fall back to invoice number. Text comparisons use `localeCompare(…, {numeric: true, sensitivity: "base"})`.

Columns: **Invoice No** (link; on mobile shows the issue date beneath), **Customer** (only with `customers:read`, truncated with a `title` tooltip), **Total**, **Status** (badge), **Issue Date** (`hidden sm:table-cell`), **Paid with** (`hidden sm:table-cell`, rendered only when at least one visible row has a value), **Updated** (`hidden md:table-cell`, right-aligned, dimmed).

Empty states: no invoices at all → centered card, _"No invoices found"_ + a **"Create your first invoice"** button. Filter matches nothing → a single row spanning all columns: _"No invoices match this filter"_.

### 10.4 `/invoices/new` and `/invoices/[id]/edit`

Both render the shared `<InvoiceEditor>`. Page header: title (**"Create Invoice"** / **"Edit Invoice #{number}"**) plus a primary **Save** button (`Save` icon) that submits the form by `form=` id. The edit page shows a warning alert when `allowProtectedInvoiceChanges` is on and the invoice is not draft/voided.

**`<InvoiceEditor>` layout, top to bottom:**

1. Row `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`:
   - **Customer** _(required)_ — select, placeholder option _"Select customer"_.
   - **Invoice Number** — text, placeholder _"e.g. INV-2025-001"_. Prefilled with the server preview. Track a `invoiceNumberTouched` flag: the preview is a `useQuery` on `["invoices", "next-number", customerId]`, `enabled` only while this is a new invoice and the user has _not_ typed — so changing the customer refetches and updates the field — and the value is **omitted** from the submit payload so the server assigns the real number.
   - **Currency** — free text (default from settings, else `EUR`).
   - **Status** — select: Draft, Sent, Paid, Complete, Overdue, Voided.
2. Row `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`: **Issue Date** (`type="date"`, required, defaults to today), **Due Date** (`type="date"`, optional).
3. **Items** section — label "Items \*" with an **"Add item"** button (`Plus`) on the right.
   - Desktop-only column header strip (`hidden lg:flex`, `text-xs opacity-60`): drag handle spacer · **Product** (w-44, only when products exist) · **Description** (flex-1) · **Quantity** (w-16/sm:w-20) · **Unit** (w-24) · **Price** (w-24) · **Tax %** (w-20, only in per-line tax mode) · **Notes** (w-40) · remove spacer.
   - Each row is a single flex line, `draggable`, reorderable by drag & drop with a `GripVertical` handle; the dragged row goes to 50% opacity and the hovered drop target gets a muted background.
   - Row fields: Product select (_"Select product"_, options labelled `name (sku)`), Description (required), Quantity (number, min 0, step any), Unit (text), Unit price (number, min 0, step any), Tax % (number, per-line mode only), Notes (text), and an `×` remove button. Removing is blocked at the last remaining row.
   - **Selecting a product** copies its `name` → description, `unitPrice` → price, `unit` → unit, and — in per-line tax mode only — the percent of its linked tax definition → Tax %.
   - New rows default to `{quantity: 1, unitPrice: 0, taxPercent: 0}`.
4. Live totals, right-aligned, `w-48` rows: **Subtotal**, **Tax** (only when > 0), **Total** (bold, `text-lg`, suffixed with the currency).
5. Keyboard hints row: `Ctrl+S` Save, `Ctrl+Enter` Add item — and wire both shortcuts (also Cmd on macOS).
6. Row `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`:
   - **Tax Mode** — _Invoice total_ (`invoice`) or _Per line_ (`line`).
   - **Tax Rate (%)** — number, hidden unless tax mode is `invoice`.
   - **Prices include tax?** — No / Yes.
   - **Rounding mode** — _Round per line_ (`line`) / _Round on total_ (`total`).
7. Row `grid-cols-1 md:grid-cols-2`: **Payment Terms** and **Notes**, both textareas (h-24), prefilled from `settings.paymentTerms` / `settings.defaultNotes` for new invoices.

On submit → the create or update mutation, navigating to `/invoices/{id}` from its `onSuccess`. Errors surface in a destructive alert at the top of the form.

### 10.5 `/invoices/[id]` (detail)

Header row: back arrow to `/invoices`, **"Invoice #{number}"**, and the status badge (rendered as _Overdue_ when the derived-overdue rule fires).

Action buttons, right-aligned and permission/status gated:

- **Edit** (`Pencil`) — per §4.6, with the confirm dialog when protected.
- **Publish** (`Upload`, success variant) — draft only, `invoices:publish`. Tooltip _"Make public and mark as sent"_.
- **Mark as Complete** (`CheckCircle`, secondary) — status `paid` only.
- **Mark as Paid** split button (`Check`, primary) — statuses `sent`/`overdue`. The chevron half opens a small panel: label _"Payment Method"_, a free-text input (placeholder _"e.g. Bank Transfer, PayPal"_), quick-pick chips **Bank Transfer / PayPal / Cash / Credit Card / Stripe**, and a block **Mark as Paid** submit.
- **More** dropdown (`MoreHorizontal`): **Duplicate** (`Copy`), **Download XML** (`FileText`), separator, **Unpublish** (`ShieldOff`, sent/overdue only), **Mark as Complete** (paid only), **Mark as Sent** (`Send`, draft only), **Void Invoice** (`Ban`, warning-colored, sent/overdue only), **Delete** (`Trash2`, destructive-colored).

Published banner (when `?published=1`): success alert with _"Invoice published"_, the full public link, and **Open** / **Copy link** / **Download PDF** buttons.

Body, `grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm`:

- Left column: **Customer**, **Address** (address line + `formatPostalCityLine(...)` + country code, preserving newlines), **Issue Date**, **Subtotal**, a dim `text-xs` meta line — `Tax rate: N% - Prices include tax: Yes/No - Rounding: … - Tax mode: Per line|Invoice total` — then **Total** (bold), **Payment Terms**, and `N item(s)`. Below that a button row: **View HTML** (`FileCode2`, outline), **Download PDF** (`Download`, primary), and **View public link** (`ExternalLink`, outline) when status ≠ draft and a share token exists.
- Right column: **Email**, **Due Date**, **Tax**, **Discount**.

Items table (bordered, rounded): **Description** (preserves whitespace) · **Qty** (right) · **Price** (right) · **Total** (right, `quantity × unitPrice`).

**Status History** — a left-bordered vertical timeline; each entry is a dot, a status badge, the timestamp (`date HH:MM`), and `· {paymentMethod}` when present. Ascending by `changedAt`.

Confirm strings: void → _"Void this invoice?"_; delete (unprotected) → _"Delete this invoice? This cannot be undone."_

### 10.6 `/customers`

Header: **"Customers"** + **"New Customer"** (`UserPlus`, primary, `customers:create`).

- Mobile (`md:hidden`): stacked link cards showing name (semibold) and email beneath.
- Desktop: zebra table — **Name** (link) · **Contact Name** · **Address** · **City / Postal Code** (via `formatPostalCityLine`) · **Email**.
- Empty state: _"No customers yet."_ + inline link _"Create your first customer"_.

### 10.7 `/customers/new` and `/customers/[id]/edit`

Header with title (**"Create Customer"** / **"Edit Customer"**) and right-aligned **Cancel** + primary submit (**"Create Customer"** / **"Save Changes"**). Fields, in order, `space-y-4`, small inputs:

1. **Name** _(required)_ — text
2. **Contact Name** — text
3. `sm:grid-cols-2`: **Email** (email) · **Phone** (text)
4. **Address** — textarea, 3 rows
5. `sm:grid-cols-2`: **City** · **Postal Code**
6. **Tax ID** — text
7. **Country Code (ISO alpha-2)** — text, placeholder _"e.g. US, NL, DE"_

Validation: name required (_"Name is required"_). On success redirect to `/customers/{id}`.

### 10.8 `/customers/[id]`

Title **"Customer {name}"**, actions **Edit** (`Pencil`) and **Delete** (`Trash2`, destructive) — the latter confirms _"Are you sure you want to delete this customer? This cannot be undone."_ Body is a bordered card, `grid sm:grid-cols-2 gap-4`, each cell a dim label over a medium-weight value, `-` when empty: Name, Contact Name, Email, Phone, Address (preserves whitespace), City / Postal Code, Tax ID, Country Code.

### 10.9 `/products`

Header: **"Products"** + **"New Product"** (`PackagePlus`). Mobile cards show name, price (right, `whitespace-nowrap`) and a 2-line-clamped description. Desktop table: **Name** (link) · **Description** (truncated) · **Price** (right, w-24). Empty state: _"No products yet."_ + _"Create your first product"_.

### 10.10 `/products/new` and `/products/[id]/edit`

Header pattern as customers. Fields:

1. _(edit only)_ **Active (Available in dropdowns)** — Switch, on by default
2. **Name** _(required)_
3. **Description** — textarea, 3 rows
4. `sm:grid-cols-2`: **Unit Price** _(required, number, step 0.01, min 0)_ · **SKU**
5. `sm:grid-cols-2`: **Unit** — select from `product_units` (placeholder _"Select unit"_, value = code, label = name) · **Category** — select from `product_categories` (_"Select category"_)
6. **Tax Definition** — select, half-width, rendered only when tax definitions exist. Placeholder option _"No default tax"_; option label `{name || code || percent%} ({percent}%)`.

### 10.11 `/products/[id]`

Title **"Product {name}"**, plus an _Inactive_ badge when soft-deleted. Actions: **Edit**, **Reactivate** (success, inactive + `products:update` only), **Delete** (destructive, confirm _"Are you sure you want to delete this product?"_). Body card, `grid sm:grid-cols-2`: Name, Unit Price (currency-formatted), Description, SKU, Unit, Category, and Tax Definition when linked.

### 10.12 `/users`

Header: **"Users"** + **"New User"** (`UserPlus`). Display-name resolution order: `displayName → name → username → email local-part → "Unnamed"`. Mobile cards: name + an **Admin** badge when applicable, email beneath. Desktop table: **Name** (link) · **Email** · **Role** (Admin badge / User ghost badge). Empty: _"No users found."_

### 10.13 `/users/new` and `/users/[id]`

Max-width `2xl` form. Fields:
