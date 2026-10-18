"use server";

import { z } from "zod";
import { startCardPayment } from "./server";

export type StartPaymentActionResult = { paymentUrl?: string; error?: string };

export async function startCardPaymentAction(
  orderId: unknown,
): Promise<StartPaymentActionResult> {
  const id = z.uuid().safeParse(orderId);
  if (!id.success) return { error: "Invalid request." };

  const result = await startCardPayment(id.data);
  return "paymentUrl" in result
    ? { paymentUrl: result.paymentUrl }
    : { error: result.error };
}