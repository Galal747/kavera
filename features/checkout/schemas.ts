import { z } from "zod";

export const previewSchema = z.object({
  addressId: z.uuid(),
  couponCode: z.string().trim().max(30),
});

export const placeOrderSchema = z.object({
  idempotencyKey: z.uuid(),
  addressId: z.uuid(),
  couponCode: z.string().trim().max(30),
    paymentMethod: z.enum(["cod", "card"]),
});