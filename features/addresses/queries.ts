import type { AddressRow } from "@/features/addresses/components/address-form";
import { createClient } from "@/lib/supabase/server";

export async function getAddresses(userId: string): Promise<AddressRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("id, full_name, phone, governorate, city, street, notes, is_default")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return (data ?? []).map((a) => ({
    id: a.id,
    fullName: a.full_name,
    phone: a.phone,
    governorate: a.governorate,
    city: a.city,
    street: a.street,
    notes: a.notes,
    isDefault: a.is_default,
  }));
}