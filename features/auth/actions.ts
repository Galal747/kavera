"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./schemas";
export type AuthResult = { error?: string; message?: string } | undefined;

// نمنع open redirect: نقبل مسار داخلي بس
function safeNext(next?: string) {
  const ok =
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.startsWith("/\\");
  return ok ? next : "/account";
}

export async function registerAction(input: unknown): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const { fullName, email, password } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    // رسالة عامة عن قصد: ما نكشفش لو الإيميل مسجّل قبل كده
    return {
      error: "Could not create the account. Try a different email or sign in.",
    };
  }

  // لو تأكيد الإيميل مفعّل، مفيش جلسة لحد ما يأكد
  if (!data.session) {
    return { message: "Check your email to confirm your account, then sign in." };
  }

  redirect("/account");
}

export async function loginAction(
  input: unknown,
  next?: string,
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect(safeNext(next));
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function forgotPasswordAction(
  input: unknown,
): Promise<AuthResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  // نفس الرد دايمًا، سواء الإيميل موجود أو لأ
  return {
    message: "If an account exists for that email, we sent a reset link.",
  };
}

export async function resetPasswordAction(
  input: unknown,
): Promise<AuthResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const supabase = await createClient();

  // لازم يكون فيه جلسة (جت من لينك الإيميل)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "Could not update the password. Try a different one." };
  }

  redirect("/account");
}