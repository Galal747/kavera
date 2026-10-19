import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// كلاينت من غير جلسة ولا cookies: للقراءة العامة بس (زي الـ sitemap).
// الـ RLS هي اللي بتحدد إيه اللي الزائر يشوفه (المنتجات النشطة بس).
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}