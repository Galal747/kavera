import { z } from "zod";
import { EGYPT_GOVERNORATES } from "@/lib/egypt";

export const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Please enter the recipient's full name")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .regex(
      /^01[0125][0-9]{8}$/,
      "Enter an Egyptian mobile number, e.g. 01012345678",
    ),
  governorate: z.enum(EGYPT_GOVERNORATES, "Choose a governorate"),
  city: z
    .string()
    .trim()
    .min(2, "Please enter the city or area")
    .max(60, "City is too long"),
  street: z
    .string()
    .trim()
    .min(5, "Please enter the full street address")
    .max(200, "Address is too long"),
  notes: z.string().trim().max(200, "Notes are too long"),
  makeDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;