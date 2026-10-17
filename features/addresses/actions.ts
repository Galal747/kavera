"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { addressSchema } from "./schemas";

export type AddressActionResult =
  | { ok?: boolean; error?: string; needsLogin?: boolean }
  | undefined;

const MAX_ADDRESSES = 5;
const idSchema = z.uuid();
const GENERIC_ERROR = "Something went wrong. Please try again.";
const LOGIN_RESULT = {
  error: "Please sign in to manage your addresses.",
  needsLogin: true,
} as const;

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createAddressAction(
  input: unknown,
): Promise<AddressActionResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { error: "Please check the form and try again." };
  const v = parsed.data;

  const { supabase, user } = await getContext();
  if (!user) return LOGIN_RESULT;

  const { count } = await supabase
    .from("addresses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  const existing = count ?? 0;
  if (existing >= MAX_ADDRESSES) {
    return { error: `You can save up to ${MAX_ADDRESSES} addresses.` };
  }

  // أول عنوان بيبقى الافتراضي تلقائي
  const isFirst = existing === 0;

  // user_id من الجلسة في السيرفر، مش من أي حاجة جاية من المتصفح
  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      full_name: v.fullName,
      phone: v.phone,
      governorate: v.governorate,
      city: v.city,
      street: v.street,
      notes: v.notes || null,
      is_default: isFirst,
    })
    .select("id")
    .single();
  if (error || !data) return { error: GENERIC_ERROR };

  if (!isFirst && v.makeDefault) {
    const { error: rpcError } = await supabase.rpc("set_default_address", {
      p_address_id: data.id,
    });
    if (rpcError) return { error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateAddressAction(
  id: unknown,
  input: unknown,
): Promise<AddressActionResult> {
  const idParsed = idSchema.safeParse(id);
  const parsed = addressSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const v = parsed.data;

  const { supabase, user } = await getContext();
  if (!user) return LOGIN_RESULT;

  const { data, error } = await supabase
    .from("addresses")
    .update({
      full_name: v.fullName,
      phone: v.phone,
      governorate: v.governorate,
      city: v.city,
      street: v.street,
      notes: v.notes || null,
    })
    .eq("id", idParsed.data)
    .eq("user_id", user.id)
    .select("id");
  if (error) return { error: GENERIC_ERROR };
  if (!data || data.length === 0) return { error: "Address not found." };

  if (v.makeDefault) {
    const { error: rpcError } = await supabase.rpc("set_default_address", {
      p_address_id: idParsed.data,
    });
    if (rpcError) return { error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setDefaultAddressAction(
  id: unknown,
): Promise<AddressActionResult> {
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return { error: GENERIC_ERROR };

  const { supabase, user } = await getContext();
  if (!user) return LOGIN_RESULT;

  const { error } = await supabase.rpc("set_default_address", {
    p_address_id: idParsed.data,
  });
  if (error) return { error: "Address not found." };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteAddressAction(
  id: unknown,
): Promise<AddressActionResult> {
  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return { error: GENERIC_ERROR };

  const { supabase, user } = await getContext();
  if (!user) return LOGIN_RESULT;

  const { data: row } = await supabase
    .from("addresses")
    .select("id, is_default")
    .eq("id", idParsed.data)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!row) return { error: "Address not found." };

  const { data: deleted, error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", row.id)
    .eq("user_id", user.id)
    .select("id");
  if (error || !deleted || deleted.length === 0) return { error: GENERIC_ERROR };

  // لو مسحنا الافتراضي، نخلي أحدث عنوان متبقي هو الافتراضي
  if (row.is_default) {
    const { data: next } = await supabase
      .from("addresses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.rpc("set_default_address", { p_address_id: next.id });
    }
  }

  revalidatePath("/", "layout");
  return { ok: true };
}