"use server";

import { asc } from "drizzle-orm";
import { db } from "@/db";
import { taxDefinitions } from "@/db/schema/tables";
import { type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import type { TaxDefinition } from "@/lib/types";

/**
 * The product editor and detail both need the rate list (§10.10, §10.11).
 * The §10.15 tax manager's writes land here alongside it.
 */
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
