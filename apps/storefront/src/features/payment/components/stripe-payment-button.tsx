"use client";

import { useState } from "react";
import { createPayment } from "../data/payment-api";

export function StripePaymentButton({ orderNumber }: { orderNumber: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    if (busy) return;

    const stripeWindow = window.open("", "_blank");
    if (stripeWindow) {
      stripeWindow.document.title = "Elvane secure payment";
      stripeWindow.document.body.innerHTML =
        '<p style="font-family:system-ui;padding:32px">Preparing secure Stripe Checkout…</p>';
    }

    setBusy(true);
    setError("");

    try {
      const payment = await createPayment(orderNumber, "STRIPE");

      if (payment.status === "PAID") {
        if (stripeWindow) stripeWindow.close();
        window.location.reload();
        return;
      }

      if (!payment.checkoutUrl) {
        if (stripeWindow) stripeWindow.close();
        throw new Error("Stripe Checkout is not available for this order.");
      }

      if (stripeWindow) {
        stripeWindow.location.replace(payment.checkoutUrl);
      } else {
        window.open(payment.checkoutUrl, "_blank", "noopener,noreferrer");
      }
    } catch (cause) {
      if (stripeWindow) stripeWindow.close();
      setError(
        cause instanceof Error ? cause.message : "Unable to prepare payment.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className="button button--primary"
        type="button"
        disabled={busy}
        onClick={pay}
      >
        {busy ? "Preparing payment…" : "Pay now"}
      </button>
      {error ? <span className="form-error">{error}</span> : null}
    </>
  );
}
