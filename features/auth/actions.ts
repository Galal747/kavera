"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "./schemas";

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