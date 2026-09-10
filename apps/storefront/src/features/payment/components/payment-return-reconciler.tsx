"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { reconcilePayment } from "@/features/payment/data/payment-api";

export function PaymentReturnReconciler({ orderNumber, paymentReturn }: { orderNumber: string; paymentReturn?: string }) {
  const router = useRouter();
  const running = useRef(false);
  const [confirming, setConfirming] = useState(paymentReturn === "success");

  const reconcile = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setConfirming(true);

    try {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        try {
          const result = await reconcilePayment(orderNumber);
          if (result.state === "CONFIRMED") {
            setConfirming(false);
            router.replace(`/orders/${encodeURIComponent(orderNumber)}`);
            router.refresh();
            return;
          }
          if (result.state !== "PROCESSING") {
            setConfirming(false);
            router.refresh();
            return;
          }
        } catch {
          // Stripe/webhook state can briefly lag the browser return.
        }
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
      setConfirming(false);
      router.refresh();
    } finally {
      running.current = false;
    }
  }, [orderNumber, router]);

  useEffect(() => {
    if (paymentReturn === "success") void reconcile();
  }, [paymentReturn, reconcile]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; orderNumber?: string; payment?: string } | null;
      if (
        data?.type === "elvane:payment-return" &&
        data.orderNumber === orderNumber &&
        data.payment === "success"
      ) {
        void reconcile();
      }
    }

    function onFocus() {
      // Covers browsers that sever window.opener while Stripe is cross-origin.
      void reconcile();
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("focus", onFocus);
    };
  }, [orderNumber, reconcile]);

  if (!confirming) return null;
  return (
    <div className="payment-return-status" role="status" aria-live="polite">
      <strong>Confirming payment…</strong>
      <span>Stripe returned successfully. Elvane is confirming the provider state. Do not pay again.</span>
    </div>
  );
}
