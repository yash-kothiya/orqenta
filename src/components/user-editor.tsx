"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as z from "zod";
import {
  createUser,
  deleteUser,
  getUser,
  getUserPermissions,
  updateUser,
  updateUserPermissions,
} from "@/app/(app)/users/actions";
import { type Action, type Resource } from "@/lib/permissions";
import { ConfirmDialog } from "@/components/detail";
import { IfPermitted } from "@/components/permission-gated-action";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { type User } from "@/lib/types";

function userLabel(user: User): string {
  return user.displayName || user.username;
}

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

export function UserEditor({ userId }: { userId?: string } = {}) {
  const editing = userId !== undefined;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const canEdit = can("users", "update");

  const {
    data: user,
    isPending,
    error,
  } = useQuery({
    queryKey: ["users", userId],
    queryFn: async () => {
      try {
        const result = await getUser(userId!);
        if (!result.ok) {
          console.error("Failed to load user:", result.error);
          throw new Error(result.error || "Failed to load user");
        }
        if (!result.data) {
          throw new Error("User not found");
        }
        return result.data;
      } catch (err) {
        console.error("User editor error:", err);
        throw err;
      }
    },
    enabled: editing,
    retry: false,
  });

  const {
    data: userPerms = [],
  } = useQuery({
    queryKey: ["users", userId, "permissions"],
    queryFn: async () => {
      try {
        const result = await getUserPermissions(userId!);
        if (!result.ok) {
          console.error("Failed to load permissions:", result.error);
          return [];
        }
        return result.data;
      } catch (err) {
        console.error("Permissions fetch error:", err);
        return [];
      }
    },
    enabled: editing,
    retry: false,
  });

  const schema = userSchema(editing);
  const userData = user ?? ({ username: "" } as User);

  // Convert user permissions to permKey format: "perm.resource.action"
  const permissionKeys = userPerms.map(
    (p) => `perm.${p.resource}.${p.action}`
  );

  const form = useForm({
    defaultValues: {
      username: userData.username ?? "",
      password: "",
      email: userData.email ?? "",
      displayName: userData.displayName ?? "",
      isAdmin: userData.isAdmin ?? false,
      isActive: userData.isActive ?? true,
      permissions: permissionKeys,
    } as UserValues,
    validators: { onBlur: schema, onSubmit: schema },
    onSubmit: async ({ value }) => {
      try {
        let userId_: string;

        if (editing) {
          const result = await updateUser(userId!, {
            username: value.username,
            email: value.email,
            displayName: value.displayName,
            isAdmin: value.isAdmin,
            isActive: value.isActive,
          });
          if (!result.ok) {
            toast.add({
              title: "Error updating user",
              description: result.error || "Failed to update user",
            });
            return;
          }
          userId_ = userId!;
        } else {
          const result = await createUser({
            username: value.username,
            password: value.password,
            email: value.email,
            displayName: value.displayName,
            isAdmin: value.isAdmin,
            isActive: value.isActive,
          });
          if (!result.ok) {
            toast.add({
              title: "Error creating user",
              description: result.error || "Failed to create user",
            });
            return;
          }
          userId_ = result.data.id;
        }

        // Parse permissions from "perm.resource.action" format to { resource, action }
        const permissions = value.permissions
          .map((perm) => {
            const parts = perm.split(".");
            if (parts.length !== 3 || parts[0] !== "perm") return null;
            return { resource: parts[1] as Resource, action: parts[2] as Action };
          })
          .filter((p) => p !== null);

        // Save permissions
        const permResult = await updateUserPermissions(userId_, permissions);
        if (!permResult.ok) {
          toast.add({
            title: "Warning: Permissions not saved",
            description: permResult.error || "Failed to save permissions",
          });
        }

        toast.add({
          title: editing ? "User updated" : "User created",
          description: `${value.username} has been saved.`,
        });

        await queryClient.invalidateQueries({
          queryKey: ["users"],
        });

        router.push("/users");
      } catch (err) {
        console.error("Form submission error:", err);
        toast.add({
          title: "Error",
          description: (err as Error).message || "Something went wrong",
        });
      }
    },
  });

  // Loading and error states must come after all hooks
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
          {editing && user ? `Edit ${userLabel(user)}` : "New User"}
        </h1>
        <IfPermitted resource="users" action={editing ? "update" : "create"}>
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/users" />}>
              Cancel
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  form="user-form"
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                  onCheckedChange={(checked) => {
                    if (canEdit) field.handleChange(checked);
                  }}
                  disabled={!canEdit}
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
                    onCheckedChange={(checked) => {
                      if (canEdit) field.handleChange(checked);
                    }}
                    disabled={!canEdit}
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
                  onChange={(value) => {
                    if (canEdit) field.handleChange(value);
                  }}
                  disabled={!canEdit}
                />
              )}
            </form.Field>
          </div>
        </FieldGroup>
      </form>

      {editing && (
        <>
          <Separator />
          <IfPermitted resource="users" action="delete">
            <ConfirmDialog
              title="Delete user"
              description="Are you sure you want to delete this user? This action cannot be undone."
              actionLabel="Delete User"
              onConfirm={async () => {
                try {
                  const result = await deleteUser(userId!);
                  if (!result.ok) {
                    toast.add({
                      title: "Error deleting user",
                      description: result.error || "Failed to delete user",
                    });
                    return;
                  }

                  toast.add({
                    title: `${user ? userLabel(user) : "User"} deleted`,
                  });

                  await queryClient.invalidateQueries({
                    queryKey: ["users"],
                  });

                  router.push("/users");
                } catch (err) {
                  console.error("Delete error:", err);
                  toast.add({
                    title: "Error",
                    description: (err as Error).message || "Failed to delete user",
                  });
                }
              }}
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
          </IfPermitted>
        </>
      )}
    </div>
  );
}
