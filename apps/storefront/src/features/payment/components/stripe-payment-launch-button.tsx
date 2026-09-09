"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPayment } from "../data/payment-api";

type Props = {
  orderNumber: string;
  label?: string;
  className?: string;
};

export function StripePaymentLaunchButton({
  orderNumber,
  label = "Pay now",
  className = "button button--primary",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function launch() {
    if (busy) return;

    // Open synchronously so browsers do not block the Stripe tab after the
    // asynchronous payment-session request completes.
    const stripeTab = window.open("about:blank", "_blank");
    if (!stripeTab) {
      setError("Allow pop-ups for TextShop to open secure payment.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const payment = await createPayment(orderNumber, "STRIPE");

      if (payment.status === "PAID") {
        stripeTab.close();
        router.push(`/orders/${encodeURIComponent(orderNumber)}`);
        router.refresh();
        return;
      }

      if (!payment.checkoutUrl) {
        stripeTab.close();
        throw new Error("Stripe checkout is not available for this order.");
      }

      stripeTab.location.replace(payment.checkoutUrl);

      // Match the stable Flutter Web flow: the original TextShop tab becomes
      // the live order-status surface while Stripe stays isolated in its tab.
      router.push(`/orders/${encodeURIComponent(orderNumber)}`);
    } catch (cause) {
      if (!stripeTab.closed) stripeTab.close();
      setError(cause instanceof Error ? cause.message : "Unable to open Stripe checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className={className} type="button" disabled={busy} onClick={launch}>
        {busy ? "Opening secure payment…" : label}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </>
  );
}
