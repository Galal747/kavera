"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerAction } from "../actions";
import { registerSchema, type RegisterValues } from "../schemas";

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterValues) {
    setServerError(null);
    setNotice(null);
    const result = await registerAction(values);
    if (result?.error) setServerError(result.error);
    if (result?.message) setNotice(result.message);
  }

  const fields = [
    { name: "fullName", label: "Full name", type: "text", auto: "name" },
    { name: "email", label: "Email", type: "email", auto: "email" },
    { name: "password", label: "Password", type: "password", auto: "new-password" },
    {
      name: "confirmPassword",
      label: "Confirm password",
      type: "password",
      auto: "new-password",
    },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase">
        Create account
      </h1>

      {fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input
            id={f.name}
            type={f.type}
            autoComplete={f.auto}
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
      {notice && (
        <p className="text-sm text-emerald-700" role="status">
          {notice}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}