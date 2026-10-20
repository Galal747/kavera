import "server-only";

import { z } from "zod";
import { addressSnapshotSchema } from "@/features/orders/address-snapshot";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PAYMOB_BASE_URL, getPaymobConfig } from "./config";
import { BRAND } from "@/lib/brand";

export type StartPaymentResult = { paymentUrl: string } | { error: string };

const GENERIC_ERROR = "We couldn't start the payment. Please try again.";

// رد الـ database: نتحقق من شكله بدل ما نصدّقه
const beginSchema = z.object({
  payment_id: z.uuid(),
  amount_cents: z.number().int().positive(),
  order_number: z.number(),
  shipping_address: addressSnapshotSchema,
});

const intentionSchema = z.object({
  client_secret: z.string().min(1),
  intention_order_id: z.number().int().positive(),
});

const BEGIN_ERRORS: Record<string, string> = {
  order_not_found: "Order not found.",
  payment_not_allowed: "This order can't be paid online anymore.",
  too_many_attempts: "Too many payment attempts. Please contact us.",
  not_authenticated: "Please sign in again to continue.",
};

function mapBeginError(message: string): string {
  const key = Object.keys(BEGIN_ERRORS).find((k) => message.includes(k));
  if (!key) {
    console.error("[payments] unexpected begin_card_payment error:", message);
    return GENERIC_ERROR;
  }
  return BEGIN_ERRORS[key] ?? GENERIC_ERROR;
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export async function startCardPayment(
  orderId: string,
): Promise<StartPaymentResult> {
  const config = getPaymobConfig();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!config || !siteUrl) {
    return { error: "Card payment isn't available right now." };
  }
  const site = trimSlash(siteUrl);
  const webhookBase = trimSlash(process.env.PAYMOB_WEBHOOK_BASE_URL || site);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return { error: "Please sign in again to continue." };
  }

  // 1) الـ database بتتأكد إن الطلب بتاعي وينفع يتدفع، وبترجّع المبلغ منها
  const { data: begin, error: beginError } = await supabase.rpc(
    "begin_card_payment",
    { p_order_id: orderId },
  );
  if (beginError) return { error: mapBeginError(beginError.message) };

  const start = beginSchema.safeParse(begin);
  if (!start.success) {
    console.error("[payments] unexpected begin_card_payment result");
    return { error: GENERIC_ERROR };
  }
  const { payment_id, amount_cents, order_number, shipping_address: a } =
    start.data;

  const [firstName = "NA", ...rest] = a.full_name.trim().split(/\s+/);
  const lastName = rest.join(" ") || "NA";

  // 2) نطلب الدفع من Paymob. المبلغ من الـ database، مش من المتصفح.
  let response: Response;
  try {
    response = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${config.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount_cents,
        currency: "EGP",
        payment_methods: [config.integrationId],
        // سطر واحد بالإجمالي، عشان مجموع السطور يطابق المبلغ دايمًا
        items: [
          {
            name: `Order #${order_number}`,
            amount: amount_cents,
            description: `${BRAND.name} order`,
            quantity: 1,
          },
        ],
        billing_data: {
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          phone_number: `+2${a.phone}`,
          street: a.street,
          city: a.city,
          state: a.governorate,
          country: "EG",
          apartment: "NA",
          floor: "NA",
          building: "NA",
          postal_code: "NA",
        },
        special_reference: payment_id,
        notification_url: `${webhookBase}/api/webhooks/paymob`,
        redirection_url: `${site}/account/orders/${orderId}/payment`,
      }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch (err) {
    console.error("[payments] could not reach Paymob:", err);
    return { error: GENERIC_ERROR };
  }

  if (!response.ok) {
    // الرد بيقول أنهي حقل فيه مشكلة. مفيش فيه مفاتيحنا.
    const text = await response.text().catch(() => "");
    console.error(`[payments] Paymob rejected the intention (${response.status}):`, text.slice(0, 600));
    return { error: GENERIC_ERROR };
  }

  const intention = intentionSchema.safeParse(await response.json().catch(() => null));
  if (!intention.success) {
    console.error("[payments] unexpected Paymob intention response");
    return { error: GENERIC_ERROR };
  }

  // 3) نربط الدفعة برقم الـ order عند Paymob (من السيرفر بمفتاح السيرفر)
  const admin = createAdminClient();
  const { error: attachError } = await admin.rpc("attach_paymob_intention", {
    p_payment_id: payment_id,
    p_paymob_order_id: intention.data.intention_order_id,
  });
  if (attachError) {
    console.error("[payments] could not attach intention:", attachError.message);
    return { error: GENERIC_ERROR };
  }

  const url = new URL(`${PAYMOB_BASE_URL}/unifiedcheckout/`);
  url.searchParams.set("publicKey", config.publicKey);
  url.searchParams.set("clientSecret", intention.data.client_secret);
  return { paymentUrl: url.toString() };
}