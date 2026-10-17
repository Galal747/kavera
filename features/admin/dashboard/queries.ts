import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// رد الـ function JSON، فبنتحقق من شكله قبل ما نعتمد عليه
const statsSchema = z.object({
  period_days: z.number(),
  sales: z.object({
    orders_count: z.number(),
    cancelled_count: z.number(),
    sales_total: z.number(),
    collected_total: z.number(),
  }),
  pending_orders: z.number(),
  products: z.object({ active: z.number(), hidden: z.number() }),
  low_stock_count: z.number(),
  low_stock: z.array(
    z.object({
      product_id: z.string(),
      name: z.string(),
      size: z.string(),
      color: z.string(),
      stock: z.number(),
    }),
  ),
  top_products: z.array(
    z.object({ name: z.string(), units: z.number(), revenue: z.number() }),
  ),
  daily: z.array(
    z.object({ day: z.string(), total: z.number(), orders: z.number() }),
  ),
});

export type DashboardStats = z.infer<typeof statsSchema>;

export async function getDashboardStats(days: number): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_dashboard_stats", {
    p_days: days,
  });
  if (error) throw new Error(error.message);
  return statsSchema.parse(data);
}