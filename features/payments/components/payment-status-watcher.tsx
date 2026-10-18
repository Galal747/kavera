"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const INTERVAL_MS = 3000;
const MAX_CHECKS = 20; // حوالي دقيقة

// بيعمل refresh للصفحة لحد ما الـ webhook يوصل والـ database تتحدّث
export function PaymentStatusWatcher() {
  const router = useRouter();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let checks = 0;
    const timer = setInterval(() => {
      checks += 1;
      router.refresh();
      if (checks >= MAX_CHECKS) {
        clearInterval(timer);
        setTimedOut(true);
      }
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <p className="text-sm" role="status">
      {timedOut
        ? "We haven't received the payment confirmation yet. This can take a few minutes. If you completed the payment, refresh this page later."
        : "Confirming your payment..."}
    </p>
  );
}