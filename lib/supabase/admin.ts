// بيعمل خطأ في الـ build لو حد استورده من كود بيتحمّل في المتصفح
import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// بيتخطى الـ RLS بالكامل: لا يُستخدم إلا في كود سيرفر موثوق بعد التحقق (زي الـ webhook).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials");
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}