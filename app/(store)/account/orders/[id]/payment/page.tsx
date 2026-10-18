import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

type Props = {
  params: Promise<{ id: string }>;
};

// Paymob بيرجّع العميل هنا بعد الدفع. الـ query بتاعتهم مش بنعتمد عليها:
// حالة الدفع بتيجي من الـ database (عن طريق الـ webhook) بس.
export default async function PaymentReturnPage({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  await requireUser(`/account/orders/${id}/payment`);
  redirect(`/account/orders/${id}?payment=return`);
}