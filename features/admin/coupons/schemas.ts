import { z } from "zod";
import { isRealDate } from "@/lib/dates";

const moneyPattern = /^\d{1,7}(\.\d{1,2})?$/;

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9_-]{3,30}$/,
        "3 to 30 characters: letters, numbers, dashes or underscores",
      ),
    type: z.enum(["percent", "fixed"]),
    value: z
      .string()
      .trim()
      .regex(moneyPattern, "Enter a valid number, e.g. 10 or 100.50")
      .refine((v) => Number(v) > 0, "Must be greater than zero"),
    minOrder: z
      .string()
      .trim()
      .refine((v) => v === "" || moneyPattern.test(v), "Enter a valid amount"),
    startsAt: z
      .string()
      .refine((v) => v === "" || isRealDate(v), "Enter a valid date"),
    expiresAt: z
      .string()
      .refine((v) => v === "" || isRealDate(v), "Enter a valid date"),
    usageLimit: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || (/^\d{1,6}$/.test(v) && Number(v) > 0),
        "Enter a whole number greater than zero",
      ),
  })
  .superRefine((v, ctx) => {
    if (v.type === "percent" && Number(v.value) > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "A percentage can't be more than 100",
      });
    }
    if (v.startsAt && v.expiresAt && v.expiresAt < v.startsAt) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expiry must be on or after the start date",
      });
    }
  });

export type CouponFormValues = z.infer<typeof couponSchema>;