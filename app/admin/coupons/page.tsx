import {
  CouponsManager,
  type CouponRow,
  type CouponStatus,
} from "@/features/admin/coupons/components/coupons-manager";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCouponsPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .select(
      "id, code, type, value, min_order, starts_at, expires_at, usage_limit, used_count, is_active",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

// eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    
  const coupons: CouponRow[] = (data ?? []).map((c) => {
    let status: CouponStatus = "active";
    if (!c.is_active) status = "inactive";
    else if (c.expires_at && new Date(c.expires_at).getTime() <= now)
      status = "expired";
    else if (c.starts_at && new Date(c.starts_at).getTime() > now)
      status = "scheduled";
    else if (c.usage_limit !== null && c.used_count >= c.usage_limit)
      status = "exhausted";

    return {
      id: c.id,
      code: c.code,
      type: c.type,
      value: Number(c.value),
      minOrder: Number(c.min_order),
      startsAt: c.starts_at,
      expiresAt: c.expires_at,
      usageLimit: c.usage_limit,
      usedCount: c.used_count,
      isActive: c.is_active,
      status,
    };
  });

  return (
    <div>
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl uppercase">
        Coupons
      </h1>
      <CouponsManager coupons={coupons} />
    </div>
  );
}