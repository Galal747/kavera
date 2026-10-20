import { z } from "zod";

// ---------------- Product ----------------

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120, "Name is too long"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is too short")
    .max(120, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and dashes only",
    ),
  description: z.string().trim().max(2000, "Description is too long"),
  // السعر كنص في الفورم (أبسط مع الـ inputs)، والسيرفر بيحوّله لرقم بعد التحقق
  price: z
    .string()
    .trim()
    .regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter a valid price, e.g. 650 or 650.50")
    .refine((v) => Number(v) > 0, "Price must be greater than zero"),
  categoryId: z.uuid("Choose a category"),
gender: z.enum(["unisex", "men", "women"], {
    message: "Choose a valid gender",
  }), // <-- السطر الجديد الخاص بالنوع
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

// ---------------- Variants ----------------

const priceOverrideField = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^\d{1,7}(\.\d{1,2})?$/, "Enter a valid price, e.g. 700"),
  ])
  .refine((v) => v === "" || Number(v) > 0, "Price must be greater than zero");

export const variantSchema = z.object({
  sizeId: z.uuid("Choose a size"),
  colorId: z.uuid("Choose a color"),
  stock: z
    .number("Enter the stock quantity")
    .int("Stock must be a whole number")
    .min(0, "Stock can't be negative")
    .max(100000, "Stock is too large"),
  priceOverride: priceOverrideField,
});

export const variantUpdateSchema = variantSchema.pick({
  stock: true,
  priceOverride: true,
});

export type VariantFormValues = z.infer<typeof variantSchema>;