import { z } from "zod";

export const MAX_QUANTITY_PER_ITEM = 10;

export const addToCartSchema = z.object({
  variantId: z.uuid(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
});

export const updateQuantitySchema = z.object({
  itemId: z.uuid(),
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
});