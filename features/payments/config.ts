import "server-only";

// مصر. نفس العنوان للـ test والـ live: نوع المفتاح هو اللي بيحدد الوضع.
export const PAYMOB_BASE_URL = "https://accept.paymob.com";

export type PaymobConfig = {
  secretKey: string;
  publicKey: string;
  integrationId: number;
  hmacSecret: string;
};

// لو أي حاجة ناقصة بيرجّع null، وخيار الكارت بيتقفل في الـ UI والسيرفر
export function getPaymobConfig(): PaymobConfig | null {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const publicKey = process.env.PAYMOB_PUBLIC_KEY;
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
  const integrationId = Number(process.env.PAYMOB_INTEGRATION_ID);

  if (
    !secretKey ||
    !publicKey ||
    !hmacSecret ||
    !Number.isInteger(integrationId) ||
    integrationId <= 0
  ) {
    return null;
  }
  return { secretKey, publicKey, integrationId, hmacSecret };
}