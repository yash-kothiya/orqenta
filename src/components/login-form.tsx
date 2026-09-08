"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as z from "zod";
import { login } from "@/app/(auth)/login/actions";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { unwrap } from "@/lib/action-result";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signIn = useMutation({
    mutationFn: (value: { username: string; password: string }) =>
      login(value).then(unwrap),
    onSuccess: () => {
      // The server-rendered shell reads the session cookie, so this has to be a
      // fresh render, not a cached one.
      router.replace("/dashboard");
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  const form = useForm({
    defaultValues: { username: "", password: "" },
    validators: { onBlur: loginSchema, onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      setError("");
      await signIn.mutateAsync(value).catch(() => {});
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

        <form.Field name="username">
          {(field) => {
            const invalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={invalid}>
                <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  autoComplete="username"
                  placeholder="Enter your username"
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
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <div className="relative">
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="pr-10"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={invalid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {invalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <form.Subscribe selector={(s) => s.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Spinner />}
              Login
            </Button>
          )}
        </form.Subscribe>
      </FieldGroup>
    </form>
  );
}
