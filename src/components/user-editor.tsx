"use client";

import { useForm } from "@tanstack/react-form";
import { Save, Trash2 } from "lucide-react";
import Link from "next/link";
import * as z from "zod";
import { ConfirmDialog } from "@/components/detail";
import { PermissionsGrid } from "@/components/permissions-grid";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { type MockUser, userLabel } from "@/lib/mock-data";

/** Password is required on create, and only length-checked on edit when typed. */
const userSchema = (editing: boolean) =>
  z.object({
    username: z.string().min(1, "Username is required"),
    password: editing
      ? z
          .string()
          .refine(
            (v) => v === "" || v.length >= 8,
            "Password must be at least 8 characters",
          )
      : z.string().min(8, "Password must be at least 8 characters"),
    email: z.string(),
    displayName: z.string(),
    isAdmin: z.boolean(),
    isActive: z.boolean(),
    permissions: z.array(z.string()),
  });

type UserValues = z.infer<ReturnType<typeof userSchema>>;

export function UserEditor({ user }: { user?: MockUser }) {
  const editing = user !== undefined;
  const schema = userSchema(editing);

  const form = useForm({
    defaultValues: {
      username: user?.username ?? "",
      password: "",
      email: user?.email ?? "",
      displayName: user?.displayName ?? "",
      isAdmin: user?.isAdmin ?? false,
      isActive: user?.isActive ?? true,
      permissions: user?.permissions ?? [],
    } as UserValues,
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      // ponytail: no server action yet — §6.5 useMutation replaces this.
      console.log("user payload", value);
      toast.add({
        title: editing ? "User updated" : "User validated",
        description: `${value.username} saved. Payload logged to the console.`,
      });
    },
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">
          {editing ? `Edit ${userLabel(user)}` : "New User"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/users" />}>
            Cancel
          </Button>
          <form.Subscribe selector={(s) => s.isSubmitting}>
            {(isSubmitting) => (
              <Button type="submit" form="user-form" disabled={isSubmitting}>
                <Save className="size-4" />
                Save
              </Button>
            )}
          </form.Subscribe>
        </div>
      </div>

      <form
        id="user-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="username">
            {(field) => {
              const invalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>Username *</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    autoComplete="off"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid}
                  />
                  {invalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="password">
            {(field) => {
              const invalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={invalid}>
                  <FieldLabel htmlFor={field.name}>
                    {editing ? "Password" : "Password *"}
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      editing ? "Leave blank to keep current password" : ""
                    }
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid}
                  />
                  {invalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : (
                    !editing && (
                      <FieldDescription>Minimum 8 characters</FieldDescription>
                    )
                  )}
                </Field>
              );
            }}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="email">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    placeholder="name@company.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="displayName">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Display Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    placeholder="e.g. Maria Lang"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="isAdmin">
            {(field) => (
              // w-fit: otherwise FieldContent stretches and throws the switch
              // to the far edge, away from its label.
              <Field orientation="horizontal" className="w-fit">
                <FieldContent>
                  <FieldTitle>Administrator</FieldTitle>
                  <FieldDescription>
                    Administrators have full access to all features.
                  </FieldDescription>
                </FieldContent>
                <Switch
                  id={field.name}
                  name={field.name}
                  checked={field.state.value}
                  onCheckedChange={field.handleChange}
                />
              </Field>
            )}
          </form.Field>

          {editing && (
            <form.Field name="isActive">
              {(field) => (
                <Field orientation="horizontal" className="w-fit">
                  <FieldContent>
                    <FieldTitle>Active</FieldTitle>
                    <FieldDescription>
                      Disabled users cannot log in.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id={field.name}
                    name={field.name}
                    checked={field.state.value}
                    onCheckedChange={field.handleChange}
                  />
                </Field>
              )}
            </form.Field>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-medium">Permissions</h2>
              <p className="text-sm text-muted-foreground">
                Select which resources and actions this user can access. Admins
                bypass these checks.
              </p>
            </div>
            <form.Field name="permissions">
              {(field) => (
                <PermissionsGrid
                  value={field.state.value}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>
        </FieldGroup>
      </form>

      {editing && (
        <>
          <Separator />
          <ConfirmDialog
            title="Delete user"
            description="Are you sure you want to delete this user? This action cannot be undone."
            actionLabel="Delete User"
            onConfirm={() =>
              toast.add({
                title: `${userLabel(user)} deleted`,
                description: "Mock only — nothing left the browser.",
              })
            }
            trigger={
              <Button
                variant="outline"
                className="w-fit text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Delete User
              </Button>
            }
          />
        </>
      )}
    </div>
  );
}
