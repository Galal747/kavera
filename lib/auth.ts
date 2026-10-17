import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // مش أدمن؟ نعرض 404 عشان ما نقولش إن فيه صفحة أدمن أصلًا
  if (profile?.role !== "admin") notFound();

  return user;
}