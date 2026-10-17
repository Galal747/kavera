"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { MAX_IMAGES_PER_PRODUCT } from "./image-rules";

export type ImageActionResult = { error?: string; ok?: boolean } | undefined;

const idSchema = z.uuid();
const storagePathSchema = z
  .string()
  .regex(/^products\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/);
const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function registerProductImageAction(
  productId: unknown,
  storagePath: unknown,
): Promise<ImageActionResult> {
  await requireAdmin();

  const pid = idSchema.safeParse(productId);
  const path = storagePathSchema.safeParse(storagePath);
  if (
    !pid.success ||
    !path.success ||
    !path.data.startsWith(`products/${pid.data}/`)
  ) {
    return { error: "Invalid image data." };
  }

  const supabase = await createClient();
  const { data, error: listError } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", pid.data);
  if (listError) return { error: GENERIC_ERROR };

  const existing = data ?? [];
  if (existing.length >= MAX_IMAGES_PER_PRODUCT) {
    return {
      error: `A product can have up to ${MAX_IMAGES_PER_PRODUCT} images.`,
    };
  }

  const nextPosition =
    existing.reduce((max, row) => Math.max(max, row.position), -1) + 1;

  const { error } = await supabase.from("product_images").insert({
    product_id: pid.data,
    storage_path: path.data,
    position: nextPosition,
  });
  if (error) {
    if (error.code === "23505") return { error: "This image is already added." };
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteProductImageAction(
  imageId: unknown,
): Promise<ImageActionResult> {
  await requireAdmin();

  const id = idSchema.safeParse(imageId);
  if (!id.success) return { error: GENERIC_ERROR };

  const supabase = await createClient();
  const { data: image } = await supabase
    .from("product_images")
    .select("id, storage_path")
    .eq("id", id.data)
    .maybeSingle();
  if (!image) return { error: "Image not found." };

  const { data: deleted, error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", image.id)
    .select("id");
  if (error || !deleted || deleted.length === 0) {
    return { error: GENERIC_ERROR };
  }

  // نمسح الملف نفسه من الـ Storage. لو فشل، الصورة اختفت من الموقع على أي حال.
  const { error: storageError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([image.storage_path]);
  if (storageError) {
    console.error("Could not remove file from storage:", storageError.message);
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

// الصورة الرئيسية = أصغر position. نخلي الصورة المختارة أصغر من الكل بواحد.
export async function setMainImageAction(
  imageId: unknown,
): Promise<ImageActionResult> {
  await requireAdmin();

  const id = idSchema.safeParse(imageId);
  if (!id.success) return { error: GENERIC_ERROR };

  const supabase = await createClient();
  const { data: image } = await supabase
    .from("product_images")
    .select("id, product_id")
    .eq("id", id.data)
    .maybeSingle();
  if (!image) return { error: "Image not found." };

  const { data: first } = await supabase
    .from("product_images")
    .select("id, position")
    .eq("product_id", image.product_id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!first || first.id === image.id) return { ok: true }; // رئيسية بالفعل

  const { data: updated, error } = await supabase
    .from("product_images")
    .update({ position: first.position - 1 })
    .eq("id", image.id)
    .select("id");
  if (error || !updated || updated.length === 0) {
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}