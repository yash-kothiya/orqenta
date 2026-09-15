/**
 * §8 — everything a fresh database needs before the app is usable.
 *
 * Idempotent throughout: this runs on every deploy, not once, so every insert
 * either conflicts away or is guarded by a read.
 *
 *   pnpm db:seed
 */
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  productCategories,
  productUnits,
  settings,
  templates,
  users,
} from "@/db/schema/tables";
import {
  BUILTIN_TEMPLATE_HTML,
  BUILTIN_TEMPLATE_NAME,
} from "@/lib/builtin-template";
import { env } from "@/lib/env";
import { SETTING_DEFAULTS } from "@/lib/settings";

/** §8 — id is the code, so a seeded row is stable across environments. */
const CATEGORIES = [
  { code: "service", name: "Service" },
  { code: "goods", name: "Goods" },
  { code: "subscription", name: "Subscription" },
  { code: "other", name: "Other" },
];

const UNITS = [
  { code: "piece", name: "Piece" },
  { code: "hour", name: "Hour" },
  { code: "day", name: "Day" },
  { code: "kg", name: "Kilogram" },
  { code: "m", name: "Meter" },
  { code: "lump_sum", name: "Lump Sum" },
];

async function seedSettings() {
  const rows = Object.entries(SETTING_DEFAULTS).map(([key, value]) => ({
    key,
    value: typeof value === "boolean" ? String(value) : value,
  }));

  // Do nothing on conflict, never update: a seed must not undo a real change
  // someone made in the settings page.
  await db.insert(settings).values(rows).onConflictDoNothing();
  return rows.length;
}

async function seedLookups() {
  await db
    .insert(productCategories)
    .values(
      CATEGORIES.map((row, index) => ({
        ...row,
        id: row.code,
        sortOrder: index + 1,
        isBuiltin: true,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(productUnits)
    .values(
      UNITS.map((row, index) => ({
        ...row,
        id: row.code,
        sortOrder: index + 1,
        isBuiltin: true,
      })),
    )
    .onConflictDoNothing();
}

async function seedTemplate() {
  const existing = await db.query.templates.findFirst({
    where: (row, { eq }) => eq(row.name, BUILTIN_TEMPLATE_NAME),
  });

  if (existing) {
    // The built-in ships with the code, so a new release should reach the
    // database; a template someone edited has a different name and is safe.
    await db
      .update(templates)
      .set({ html: BUILTIN_TEMPLATE_HTML })
      .where(eq(templates.id, existing.id));
    return "updated";
  }

  const anyDefault = await db.query.templates.findFirst({
    where: (row, { eq }) => eq(row.isDefault, true),
  });

  await db.insert(templates).values({
    name: BUILTIN_TEMPLATE_NAME,
    html: BUILTIN_TEMPLATE_HTML,
    templateType: "builtin",
    // Only claim the default when nothing else holds it.
    isDefault: !anyDefault,
  });
  return "created";
}

async function seedAdmin() {
  const existing = await db.query.users.findFirst({ columns: { id: true } });
  if (existing) return "kept";

  await db
    .insert(users)
    .values({
      username: env.ADMIN_USER,
      passwordHash: await hash(env.ADMIN_PASS, 10),
      displayName: "Administrator",
      isAdmin: true,
    })
    .onConflictDoNothing();

  return "created";
}

async function main() {
  const settingCount = await seedSettings();
  await seedLookups();
  const template = await seedTemplate();
  const admin = await seedAdmin();

  console.log(
    [
      `settings: ${settingCount} keys ensured`,
      `lookups: ${CATEGORIES.length} categories, ${UNITS.length} units`,
      `template: ${BUILTIN_TEMPLATE_NAME} ${template}`,
      `admin: ${admin}`,
    ].join("\n"),
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
