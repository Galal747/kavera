"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ORDER_STATUSES } from "@/features/orders/status";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OrderStatusResult = { ok?: boolean; error?: string } | undefined;

const inputSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(ORDER_STATUSES),
});

const GENERIC_ERROR = "Something went wrong. Please try again.";

const ERRORS: Record<string, string> = {
  not_authorized: "You don't have permission to do that.",
  order_not_found: "Order not found.",
  invalid_transition:
    "This order's status has changed. Refresh the page and try again.",
  refund_required: "This order was already paid. Refunds aren't supported yet.",
};

export async function updateOrderStatusAction(
  input: unknown,
): Promise<OrderStatusResult> {
  // الطبقة الأولى: لازم أدمن
  await requireAdmin();

  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };

  // الطبقة التانية: الـ function في الـ database بتتأكد من الأدمن وتفرض قواعد الانتقال
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_order_status", {
    p_order_id: parsed.data.orderId,
    p_new_status: parsed.data.status,
  });

  if (error) {
    const key = Object.keys(ERRORS).find((k) => error.message.includes(k));
    if (!key) {
      console.error("Unexpected order status error:", error.message);
      return { error: GENERIC_ERROR };
    }
    return { error: ERRORS[key] ?? GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}