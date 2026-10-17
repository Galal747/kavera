export const PRODUCT_IMAGES_BUCKET = "product-images";

// الداتابيز بتخزّن الـ path، والرابط بيتبني منه هنا
export function getProductImageUrl(storagePath: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${storagePath}`;
}