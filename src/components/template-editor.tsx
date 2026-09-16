"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  updateTemplate,
} from "@/app/(app)/templates/actions";
import { TEMPLATE_TYPES } from "@/lib/types";
import { ConfirmDialog } from "@/components/detail";
import { IfPermitted } from "@/components/permission-gated-action";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { TemplatePreview } from "@/components/template-preview";
import type { Template } from "@/lib/types";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  html: z.string().min(1, "HTML is required"),
  isDefault: z.boolean(),
  templateType: z.enum(TEMPLATE_TYPES),
});

type TemplateValues = z.infer<typeof templateSchema>;

export function TemplateEditor({ templateId }: { templateId?: string } = {}) {
  const editing = templateId !== undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const canEdit = can("templates", "update");

  const {
    data: template,
    isPending,
    error,
  } = useQuery({
    queryKey: ["templates", templateId],
    queryFn: async () => {
      try {
        const result = await getTemplate(templateId!);
        if (!result.ok) {
          console.error("Failed to load template:", result.error);
          throw new Error(result.error || "Failed to load template");
        }
        if (!result.data) {
          throw new Error("Template not found");
        }
        return result.data;
      } catch (err) {
        console.error("Template editor error:", err);
        throw err;
      }
    },
    enabled: editing,
    retry: false,
  });

  const templateData = template ?? ({ name: "" } as Template);

  const form = useForm({
    defaultValues: {
      name: templateData.name ?? "",
      html: templateData.html ?? "",
      isDefault: templateData.isDefault ?? false,
      templateType: templateData.templateType ?? "local",
    } as TemplateValues,
    validators: { onBlur: templateSchema, onSubmit: templateSchema },
    onSubmit: async ({ value }) => {
      try {
        if (editing) {
          const result = await updateTemplate(templateId!, value);
          if (!result.ok) {
            toast.add({
              title: "Error updating template",
              description: result.error || "Failed to update template",
            });
            return;
          }
        } else {
          const result = await createTemplate(value);
          if (!result.ok) {
            toast.add({
              title: "Error creating template",
              description: result.error || "Failed to create template",
            });
            return;
          }
        }

        toast.add({
          title: editing ? "Template updated" : "Template created",
          description: `${value.name} has been saved.`,
        });

        await queryClient.invalidateQueries({
          queryKey: ["templates"],
        });

        router.push("/templates");
      } catch (err) {
        console.error("Form submission error:", err);
        toast.add({
          title: "Error",
          description: (err as Error).message || "Something went wrong",
        });
      }
    },
  });

  if (editing && isPending) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (editing && error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{(error as Error).message}</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {editing ? `Edit ${templateData.name}` : "New Template"}
        </h1>
        <IfPermitted resource="templates" action={editing ? "update" : "create"}>
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/templates" />}>
              Cancel
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  form="template-form"
                  disabled={isSubmitting}
                >
                  <Save className="size-4" />
                  Save
                </Button>
              )}
            </form.Subscribe>
          </div>
        </IfPermitted>
      </div>

      <form
        id="template-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="name">
            {(field) => {
              const invalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Name *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid}
                    disabled={!canEdit}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="templateType">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Type</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => {
                      if (canEdit && value) field.handleChange(value as any);
                    }}
                    disabled={!canEdit}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>

            <form.Field name="isDefault">
              {(field) => (
                <Field orientation="horizontal" className="w-fit">
                  <FieldTitle>Set as Default</FieldTitle>
                  <FieldDescription>
                    Use this for new invoices
                  </FieldDescription>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => {
                      if (canEdit) field.handleChange(checked);
                    }}
                    disabled={!canEdit}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <form.Field name="html">
              {(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel htmlFor={field.name}>
                      HTML Template *
                    </FieldLabel>
                    <FieldDescription>
                      Use {"{{token}}"} placeholders for dynamic content
                    </FieldDescription>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      rows={15}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={invalid}
                      className="font-mono text-sm"
                      disabled={!canEdit}
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Subscribe selector={(s) => s.values.html}>
              {(html) => <TemplatePreview html={html} />}
            </form.Subscribe>
          </div>
        </FieldGroup>
      </form>

      {editing && (
        <>
          <Separator />
          <IfPermitted resource="templates" action="delete">
            <ConfirmDialog
              title="Delete template"
              description="Are you sure you want to delete this template? This action cannot be undone."
              actionLabel="Delete Template"
              onConfirm={async () => {
                try {
                  const result = await deleteTemplate(templateId!);
                  if (!result.ok) {
                    toast.add({
                      title: "Error deleting template",
                      description: result.error || "Failed to delete template",
                    });
                    return;
                  }

                  toast.add({
                    title: `${templateData.name} deleted`,
                  });

                  await queryClient.invalidateQueries({
                    queryKey: ["templates"],
                  });

                  router.push("/templates");
                } catch (err) {
                  console.error("Delete error:", err);
                  toast.add({
                    title: "Error",
                    description: (err as Error).message || "Failed to delete template",
                  });
                }
              }}
              trigger={
                <Button
                  variant="outline"
                  className="w-fit text-destructive hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                  Delete Template
                </Button>
              }
            />
          </IfPermitted>
        </>
      )}
    </div>
  );
}
