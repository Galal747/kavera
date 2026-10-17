"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "../actions";
import { loginSchema, type LoginValues } from "../schemas";

export function LoginForm({ next }: { next?: string }) {
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

    async function onSubmit(values: LoginValues) {
        setServerError(null);
        const result = await loginAction(values, next);
        if (result?.error) setServerError(result.error);
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase">
                Sign in
            </h1>

            <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={errors.email ? "true" : "false"}
                    {...register("email")}
                />
                {errors.email && (
                    <p className="text-sm text-red-600" role="alert">
                        {errors.email.message}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={errors.password ? "true" : "false"}
                    {...register("password")}
                />

                <div className="text-right">
                    <Link
                        href="/forgot-password"
                        className="text-sm text-neutral-600 underline underline-offset-4"
                    >
                        Forgot password?
                    </Link>
                </div>
                {errors.password && (
                    <p className="text-sm text-red-600" role="alert">
                        {errors.password.message}
                    </p>
                )}
            </div>

            {serverError && (
                <p className="text-sm text-red-600" role="alert">
                    {serverError}
                </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-sm text-neutral-600">
                New here?{" "}
                <Link href="/register" className="underline underline-offset-4">
                    Create an account
                </Link>
            </p>
        </form>
    );
}