import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // من غير جلسة (يعني ما جاش من لينك الإيميل) مفيش حاجة نعملها هنا
  if (!user) redirect("/forgot-password?error=expired");

  return <ResetPasswordForm />;
}