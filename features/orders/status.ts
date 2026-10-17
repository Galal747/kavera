const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  card: "Card",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-neutral-200 text-neutral-700",
};

export const orderStatusLabel = (s: string) => ORDER_STATUS_LABELS[s] ?? s;
export const paymentStatusLabel = (s: string) => PAYMENT_STATUS_LABELS[s] ?? s;
export const paymentMethodLabel = (s: string) => PAYMENT_METHOD_LABELS[s] ?? s;
export const orderStatusStyle = (s: string) =>
  STATUS_STYLES[s] ?? "bg-neutral-200 text-neutral-700";
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// نفس قواعد الـ database. هنا لإخفاء الأزرار بس،
// والـ database هي اللي بتفرض القاعدة فعلًا.
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const ACTION_LABELS: Record<OrderStatus, string> = {
  pending: "Mark as pending",
  confirmed: "Confirm order",
  processing: "Start processing",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
};