import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

// بيرجّع true لو لسه في الحد المسموح.
// لو الفحص نفسه فشل بنسمح ونسجّل الخطأ: عطل في الـ limiter مايوقّفش المتجر.
export async function withinRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error || typeof data !== "boolean") {
      console.error("[rate-limit] check failed:", error?.message);
      return true;
    }
    return data;
  } catch (err) {
    console.error("[rate-limit] check failed:", err);
    return true;
  }
}