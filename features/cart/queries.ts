import { MAX_QUANTITY_PER_ITEM } from "@/features/cart/schemas";
import { getProductImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

export type CartLine = {
  id: string;
  quantity: number;
  productSlug: string | null;
  productName: string;
  size: string;
  color: string;
  colorHex: string;
  imageUrl: string | null;
  unitPrice: number;
  lineTotal: number;
  maxQuantity: number;
  problem: string | null; // لو مش null، السطر مش صالح للشراء
};

export type Cart = {
  lines: CartLine[];
  subtotal: number; // السطور الصالحة بس
  itemCount: number;
  hasProblems: boolean;
};

const CART_SELECT = `
  id, quantity,
  product_variants (
    id, stock_quantity, price_override,
    sizes ( name ),
    colors ( name, hex ),
    products (
      slug, name, base_price, is_active,
      product_images ( storage_path, position )
    )
  )
`;

export async function getCart(): Promise<Cart> {
  const supabase = await createClient();

  // الـ RLS بترجّع سلة المستخدم الحالي بس
  const { data, error } = await supabase
    .from("cart_items")
    .select(CART_SELECT)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const lines: CartLine[] = (data ?? []).map((row) => {
    // لو المنتج اتخفى أو اتمسح، الـ RLS بترجّع الـ variant بـ null
    const v = row.product_variants as typeof row.product_variants | null;

    if (!v) {
      return {
        id: row.id,
        quantity: row.quantity,
        productSlug: null,
        productName: "Unavailable item",
        size: "",
        color: "",
        colorHex: "#d4d4d4",
        imageUrl: null,
        unitPrice: 0,
        lineTotal: 0,
        maxQuantity: 0,
        problem: "This item is no longer available.",
      };
    }

    const unitPrice =
      v.price_override === null
        ? Number(v.products.base_price)
        : Number(v.price_override);

    const mainImage = [...v.products.product_images].sort(
      (a, b) => a.position - b.position,
    )[0];

    let problem: string | null = null;
    if (v.stock_quantity <= 0) problem = "Sold out.";
    else if (row.quantity > v.stock_quantity)
      problem = `Only ${v.stock_quantity} left. Please reduce the quantity.`;

    return {
      id: row.id,
      quantity: row.quantity,
      productSlug: v.products.slug,
      productName: v.products.name,
      size: v.sizes.name,
      color: v.colors.name,
      colorHex: v.colors.hex,
      imageUrl: mainImage ? getProductImageUrl(mainImage.storage_path) : null,
      unitPrice,
      lineTotal: unitPrice * row.quantity,
      maxQuantity: Math.min(MAX_QUANTITY_PER_ITEM, v.stock_quantity),
      problem,
    };
  });

  const validLines = lines.filter((l) => l.problem === null);

  return {
    lines,
    subtotal: validLines.reduce((sum, l) => sum + l.lineTotal, 0),
    itemCount: lines.reduce((sum, l) => sum + l.quantity, 0),
    hasProblems: lines.some((l) => l.problem !== null),
  };
}