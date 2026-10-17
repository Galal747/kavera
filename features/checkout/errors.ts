export type OrderErrorResult = {
  error: string;
  field: "coupon" | "general";
};

const GENERIC: OrderErrorResult = {
  error: "Something went wrong. Please try again.",
  field: "general",
};

const ERRORS: Record<string, OrderErrorResult> = {
  cart_empty: { error: "Your cart is empty.", field: "general" },
  items_unavailable: {
    error:
      "Some items in your cart are no longer available in the quantity you chose. Please review your cart.",
    field: "general",
  },
  cart_changed: {
    error:
      "Your cart changed while we were placing the order. Please review it and try again.",
    field: "general",
  },
  shipping_unavailable: {
    error: "We can't ship to the selected governorate yet.",
    field: "general",
  },
  address_not_found: {
    error: "Please choose a valid shipping address.",
    field: "general",
  },
  payment_method_unsupported: {
    error: "This payment method isn't available yet.",
    field: "general",
  },
  not_authenticated: {
    error: "Please sign in again to continue.",
    field: "general",
  },
  coupon_invalid: {
    error: "This coupon code isn't valid.",
    field: "coupon",
  },
  coupon_expired: {
    error: "This coupon has expired or isn't active yet.",
    field: "coupon",
  },
  coupon_exhausted: {
    error: "This coupon has reached its usage limit.",
    field: "coupon",
  },
  coupon_min_order: {
    error: "Your order doesn't reach the minimum amount for this coupon.",
    field: "coupon",
  },
};

export function mapOrderError(message: string): OrderErrorResult {
  const key = Object.keys(ERRORS).find((k) => message.includes(k));
  if (!key) {
    // الأخطاء المجهولة بنسجّلها في السيرفر بس، ومابنعرضهاش للمستخدم
    console.error("Unexpected order error:", message);
    return GENERIC;
  }
  return ERRORS[key] ?? GENERIC;
}