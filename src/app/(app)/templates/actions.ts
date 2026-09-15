"use server";

import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { templates } from "@/db/schema/tables";
import { ActionError, type ActionResult, runAction } from "@/lib/action-result";
import { requirePermission } from "@/lib/auth/session";
import { TEMPLATE_TYPES, type Template } from "@/lib/types";

const templateInput = z.object({
  name: z.string().min(1, "Name is required"),
  html: z.string().min(1, "HTML is required"),
  isDefault: z.boolean().default(false),
  templateType: z.enum(TEMPLATE_TYPES).default("local"),
});

export type TemplateInput = z.infer<typeof templateInput>;

export async function listTemplates(): Promise<ActionResult<Template[]>> {
  return runAction(async () => {
    await requirePermission("templates", "read");
    return db.select().from(templates).orderBy(asc(templates.name));
  });
}

export async function getTemplate(id: string): Promise<ActionResult<Template | null>> {
  return runAction(async () => {
    await requirePermission("templates", "read");
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });
    return template ?? null;
  });
}

export async function createTemplate(
  input: TemplateInput,
): Promise<ActionResult<Template>> {
  return runAction(async () => {
    await requirePermission("templates", "create");
    const validated = templateInput.parse(input);

    const [newTemplate] = await db
      .insert(templates)
      .values({
        name: validated.name,
        html: validated.html,
        isDefault: validated.isDefault,
        templateType: validated.templateType,
      })
      .returning();

    return newTemplate;
  });
}

export async function updateTemplate(
  id: string,
  input: TemplateInput,
): Promise<ActionResult<Template>> {
  return runAction(async () => {
    await requirePermission("templates", "update");
    const validated = templateInput.parse(input);

    const [updated] = await db
      .update(templates)
      .set({
        name: validated.name,
        html: validated.html,
        isDefault: validated.isDefault,
        templateType: validated.templateType,
      })
      .where(eq(templates.id, id))
      .returning();

    if (!updated) throw new ActionError("Template not found");
    return updated;
  });
}

export async function deleteTemplate(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    await requirePermission("templates", "delete");

    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id),
    });
    if (!template) throw new ActionError("Template not found");

    await db.delete(templates).where(eq(templates.id, id));
    return null;
  });
}
