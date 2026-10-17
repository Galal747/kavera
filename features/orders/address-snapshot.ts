import { z } from "zod";

// نسخة العنوان اللي اتخزنت مع الطلب (JSON). بنتحقق من شكلها قبل العرض.
export const addressSnapshotSchema = z.object({
  full_name: z.string(),
  phone: z.string(),
  governorate: z.string(),
  city: z.string(),
  street: z.string(),
  notes: z.string().nullable().optional(),
});