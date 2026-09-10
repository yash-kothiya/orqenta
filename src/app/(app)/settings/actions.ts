"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, taxDefinitions, templates } from "@/db/schema/tables";
import { ActionError, type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import {
  CLEARABLE_SETTING_KEYS,
  isSettingKey,
  rowsToSettings,
  type Settings,
} from "@/lib/settings";
import type { TaxDefinition } from "@/lib/types";

export async function listTaxDefinitions(): Promise<
  ActionResult<TaxDefinition[]>
> {
  return runAction(async () => {
    await requirePermission("tax_definitions", "read");
    return db
      .select()
      .from(taxDefinitions)
      .orderBy(asc(taxDefinitions.percent), asc(taxDefinitions.code));
  });
}

export async function getSettings(): Promise<ActionResult<Settings>> {
  return runAction(async () => {
    await requirePermission("settings", "read");
    return rowsToSettings(await db.select().from(settings));
  });
}

export async function updateSettings(
  input: Partial<Settings>,
): Promise<ActionResult<Settings>> {
  return runAction(async () => {
    await requirePermission("settings", "update");

    for (const key of Object.keys(input)) {
      if (!isSettingKey(key))
        throw new ActionError(`Unknown setting "${key}".`);
    }

    const writes = { ...input };
    if (typeof writes.logo === "string" && writes.logo.startsWith("data:")) {
      writes.logo = await storeLogo(writes.logo);
    }

    for (const [key, value] of Object.entries(writes)) {
      const text = typeof value === "boolean" ? String(value) : (value ?? "");

      if (
        text === "" &&
        (CLEARABLE_SETTING_KEYS as readonly string[]).includes(key)
      ) {
        await db.delete(settings).where(eq(settings.key, key));
        continue;
      }

      await db
        .insert(settings)
        .values({ key, value: text })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: text, updatedAt: new Date() },
        });
    }

    // §6.3 — the chosen template is the default template; the flag and the
    // setting are two views of one fact and have to move together.
    if (writes.templateId !== undefined) {
      await db.update(templates).set({ isDefault: false });
      if (writes.templateId) {
        await db
          .update(templates)
          .set({ isDefault: true })
          .where(eq(templates.id, writes.templateId));
      }
    }

    const result = await getSettings();
    if (!result.ok) throw new ActionError(result.error);
    return result.data;
  });
}

const LOGO_DIR = path.join(process.cwd(), "public", "uploads", "logos");

/** Roughly 1.5 MB of image; a server action body is capped well below that. */
const MAX_LOGO_BYTES = 1_500_000;

/**
 * §6.3 — an inline data image is written to disk and replaced by its served
 * path, so the settings table never carries a megabyte of base64.
 */
async function storeLogo(dataUrl: string) {
  const match =
    /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new ActionError("Upload a PNG, JPEG, GIF, WebP or SVG.");

  const [, subtype, base64] = match;
  const bytes = Buffer.from(base64, "base64");
  if (bytes.byteLength > MAX_LOGO_BYTES) {
    throw new ActionError("That logo is too large — keep it under 1.5 MB.");
  }

  const extension =
    subtype.toLowerCase() === "svg+xml"
      ? "svg"
      : subtype.toLowerCase() === "jpeg"
        ? "jpg"
        : subtype.toLowerCase();

  const filename = `${randomUUID()}.${extension}`;
  await mkdir(LOGO_DIR, { recursive: true });
  await writeFile(path.join(LOGO_DIR, filename), bytes);

  return `/uploads/logos/${filename}`;
}
