import { NextResponse, type NextRequest } from "next/server";
import {
  classifyTransaction,
  processedCallbackSchema,
  summarizeTransaction,
  verifyPaymobHmac,
} from "@/features/payments/paymob";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret) {
    console.error("[paymob] PAYMOB_HMAC_SECRET is not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // callbacks تانية (زي card token) ليها HMAC مختلف ومش بنتعامل معاها هنا
  if (
    typeof body === "object" &&
    body !== null &&
    "type" in body &&
    body.type !== "TRANSACTION"
  ) {
    return NextResponse.json({ status: "ignored_type" });
  }

  const parsed = processedCallbackSchema.safeParse(body);
  if (!parsed.success) {
    // لو callback حقيقي فشل هنا، هنشوف السبب في الـ logs ونظبط الـ schema
    console.error("[paymob] unexpected payload shape", parsed.error.issues);
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const t = parsed.data.obj;

  // أهم خطوة: لو التوقيع مش سليم، ماننفّذش حاجة
  const receivedHmac = request.nextUrl.searchParams.get("hmac") ?? "";
  if (!verifyPaymobHmac(t, receivedHmac, secret)) {
    console.warn("[paymob] rejected callback with invalid HMAC");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const outcome = classifyTransaction(t);
  if (outcome === "ignored") {
    return NextResponse.json({ status: "ignored_transaction_kind" });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("apply_paymob_transaction", {
    p_paymob_order_id: t.order.id,
    p_paymob_transaction_id: t.id,
    p_amount_cents: t.amount_cents,
    p_currency: t.currency,
    p_outcome: outcome,
    p_summary: summarizeTransaction(t),
  });

  if (error) {
    // خطأ حقيقي عندنا: نرجّع 500 عشان الدفعة ما تضيعش بصمت
    console.error("[paymob] failed to apply transaction", error.message);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }

  // حالات محتاجة عين بشرية
  if (
    data === "amount_mismatch" ||
    data === "unknown_payment" ||
    data === "needs_refund"
  ) {
    console.error(
      `[paymob] ATTENTION: ${data} (paymob order ${t.order.id}, transaction ${t.id})`,
    );
  }

  return NextResponse.json({ status: data });
}