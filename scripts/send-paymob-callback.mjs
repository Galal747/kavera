// الاستخدام:
//   node --env-file=.env.local scripts/send-paymob-callback.mjs <سيناريو> <paymobOrderId> <amountCents>
//
// السيناريوهات: success | failed | pending | refund | badhmac
import { createHmac } from "node:crypto";

const [scenario, orderIdArg, amountArg] = process.argv.slice(2);
const secret = process.env.PAYMOB_HMAC_SECRET;
const baseUrl = process.env.WEBHOOK_URL ?? "http://localhost:3000";

if (!scenario || !orderIdArg || !amountArg || !secret) {
  console.error(
    "Usage: node --env-file=.env.local scripts/send-paymob-callback.mjs <success|failed|pending|refund|badhmac> <paymobOrderId> <amountCents>",
  );
  process.exit(1);
}

const obj = {
  id: Number(`9${Date.now()}`.slice(0, 9)), // رقم معاملة عشوائي
  pending: scenario === "pending",
  amount_cents: Number(amountArg),
  success: scenario === "success" || scenario === "refund",
  is_auth: false,
  is_capture: false,
  is_standalone_payment: true,
  is_voided: false,
  is_refunded: scenario === "refund",
  is_3d_secure: true,
  integration_id: 4097558,
  has_parent_transaction: scenario === "refund",
  created_at: "2026-10-18T11:33:44.592345",
  currency: "EGP",
  error_occured: scenario === "failed",
  owner: 302852,
  order: { id: Number(orderIdArg) },
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
};

// ترتيب الحقول حسب docs بتاعة Paymob (مكتوب هنا بشكل مستقل عن كود الموقع)
const hmacFields = [
  obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
  obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
  obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
  obj.is_voided, obj.order.id, obj.owner, obj.pending,
  obj.source_data.pan, obj.source_data.sub_type, obj.source_data.type,
  obj.success,
];

let hmac = createHmac("sha512", secret)
  .update(hmacFields.map(String).join(""))
  .digest("hex");

if (scenario === "badhmac") hmac = "0".repeat(128);

const response = await fetch(`${baseUrl}/api/webhooks/paymob?hmac=${hmac}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type: "TRANSACTION", obj }),
});

console.log(`${scenario}: HTTP ${response.status}`, await response.text());