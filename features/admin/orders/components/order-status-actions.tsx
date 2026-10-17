"use client";

import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  ACTION_LABELS,
  NEXT_STATUSES,
  type OrderStatus,
} from "@/features/orders/status";
import { updateOrderStatusAction } from "../actions";

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  paymentMethod: string;
};

export function OrderStatusActions({
  orderId,
  currentStatus,
  paymentMethod,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OrderStatus | null>(null);

  const nextStatuses = NEXT_STATUSES[currentStatus];

  function run(status: OrderStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status });
      if (result?.error) setError(result.error);
      setConfirmTarget(null);
    });
  }

  function handleClick(status: OrderStatus) {
    if (status === "cancelled" || status === "delivered") {
      setConfirmTarget(status);
    } else {
      run(status);
    }
  }

  if (nextStatuses.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        No further actions. This order is final.
      </p>
    );
  }

  const isCancel = confirmTarget === "cancelled";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <Button
            key={status}
            type="button"
            variant={status === "cancelled" ? "outline" : "default"}
            disabled={pending}
            onClick={() => handleClick(status)}
          >
            {ACTION_LABELS[status]}
          </Button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirmTarget !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmTarget(null);
        }}
        title={isCancel ? "Cancel this order?" : "Mark as delivered?"}
        description={
          isCancel
            ? "The items go back to stock and any coupon use is returned. The customer will see the order as cancelled. This can't be undone."
            : paymentMethod === "cod"
              ? "The order will be marked as delivered and the cash payment as received. This can't be undone."
              : "The order will be marked as delivered. This can't be undone."
        }
        confirmLabel={isCancel ? "Cancel order" : "Mark delivered"}
        pending={pending}
        onConfirm={() => {
          if (confirmTarget) run(confirmTarget);
        }}
      />
    </div>
  );
}