"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { startCardPaymentAction } from "../actions";

export function PayNowButton({
  orderId,
  label,
}: {
  orderId: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pay() {
    setError(null);
    startTransition(async () => {
      const result = await startCardPaymentAction(orderId);
      if (result.paymentUrl) {
        setRedirecting(true);
        window.location.assign(result.paymentUrl);
        return;
      }
      setError(result.error ?? "We couldn't start the payment.");
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={pay} disabled={pending || redirecting}>
        {pending || redirecting ? "Opening payment page..." : label}
      </Button>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}