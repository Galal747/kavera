"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "../actions";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";

export function ResetPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(values: ResetPasswordValues) {
    setServerError(null);
    const result = await resetPasswordAction(values);
    if (result?.error) setServerError(result.error);
  }

  const fields = [
    { name: "password", label: "New password" },
    { name: "confirmPassword", label: "Confirm new password" },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase">
        New password
      </h1>

      {fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input
            id={f.name}
            type="password"
            autoComplete="new-password"
            aria-invalid={errors[f.name] ? "true" : "false"}
            {...register(f.name)}
          />
          {errors[f.name] && (
            <p className="text-sm text-red-600" role="alert">
              {errors[f.name]?.message}
            </p>
          )}
        </div>
      ))}

      {serverError && (
        <p className="text-sm text-red-600" role="alert">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Update password"}
      </Button>
    </form>
  );
}