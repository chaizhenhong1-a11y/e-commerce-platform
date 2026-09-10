"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PublicOrderStatus } from "@/features/orders/domain/order-status";
import { createPayment } from "../data/payment-api";
import type { Payment, PaymentProvider } from "../domain/payment";

const billplzEnabled = process.env.NEXT_PUBLIC_BILLPLZ_ENABLED === "true";
const stripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";

function money(cents: number) {
  return `RM ${(cents / 100).toFixed(2)}`;
}

function formatRemaining(milliseconds: number) {
  if (milliseconds <= 0) return "Expired";

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function PaymentView({
  initialOrder,
}: {
  initialOrder: PublicOrderStatus;
}) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [busyProvider, setBusyProvider] = useState<PaymentProvider | null>(
    null,
  );
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const reservationDeadline = useMemo(
    () =>
      initialOrder.reservationExpiresAt
        ? new Date(initialOrder.reservationExpiresAt).getTime()
        : null,
    [initialOrder.reservationExpiresAt],
  );

  useEffect(() => {
    if (!reservationDeadline) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [reservationDeadline]);

  const reservationExpired =
    reservationDeadline !== null && reservationDeadline <= now;

  const paid =
    ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "FULFILLED"].includes(
      initialOrder.status,
    ) ||
    initialOrder.paymentStatus === "PAID" ||
    payment?.status === "PAID";

  const canPay =
    initialOrder.status === "AWAITING_PAYMENT" &&
    initialOrder.paymentStatus === "PENDING" &&
    !reservationExpired &&
    !paid;

  async function prepare(provider: PaymentProvider) {
    if (busyProvider || !canPay) {
      return;
    }

    setBusyProvider(provider);
    setError("");

    try {
      const created = await createPayment(initialOrder.orderNumber, provider);

      if (created.status === "PAID") {
        setPayment(created);
        return;
      }

      if (created.checkoutUrl) {
        window.location.assign(created.checkoutUrl);
        return;
      }

      setPayment(created);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to prepare payment.",
      );
    } finally {
      setBusyProvider(null);
    }
  }

  if (paid) {
    return (
      <section className="checkout-success">
        <div className="checkout-success__icon">✓</div>

        <span className="section-kicker">PAYMENT COMPLETE</span>

        <h2>Order confirmed.</h2>

        <p>
          This order is already paid. Starting another payment is blocked by the
          backend.
        </p>

        <div className="checkout-success__number">
          <span>Order number</span>
          <strong>{initialOrder.orderNumber}</strong>
        </div>

        <div className="checkout-success__actions">
          <Link
            className="button button--primary"
            href={`/orders/${encodeURIComponent(initialOrder.orderNumber)}`}
          >
            View order status
          </Link>

          <Link className="button" href="/#shop">
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  if (!canPay) {
    const cancelled = initialOrder.status === "CANCELLED";
    const expired = initialOrder.status === "EXPIRED" || reservationExpired;

    return (
      <section className="payment-card payment-card--blocked">
        <span className="section-kicker">PAYMENT RECOVERY</span>

        <h1>
          {cancelled
            ? "Order cancelled"
            : expired
              ? "Payment expired"
              : "Payment unavailable"}
        </h1>

        <p>
          {cancelled
            ? "This order was cancelled and cannot accept another payment."
            : expired
              ? "The 30-minute inventory reservation ended. A new payment cannot be started for this order."
              : "This order is not currently eligible for payment."}
        </p>

        <div className="payment-recovery-actions">
          <Link
            className="button button--primary"
            href={`/orders/${encodeURIComponent(initialOrder.orderNumber)}`}
          >
            View order details
          </Link>

          <Link className="button" href="/#shop">
            Shop again
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="payment-card">
      <span className="section-kicker">PAYMENT RECOVERY</span>

      <h1>Complete your payment</h1>

      <p>
        Continue an existing gateway session when possible. If you switch
        providers, Elvane closes the previous open session before creating
        another one.
      </p>

      <div className="payment-recovery-summary">
        <div>
          <span>Order</span>
          <strong>{initialOrder.orderNumber}</strong>
        </div>

        <div>
          <span>Total</span>
          <strong>{money(initialOrder.totalCents)}</strong>
        </div>

        <div>
          <span>Inventory reservation</span>
          <strong>
            {reservationDeadline
              ? formatRemaining(reservationDeadline - now)
              : "Active"}
          </strong>
        </div>
      </div>

      {initialOrder.payment ? (
        <div className="payment-recovery-banner">
          <strong>Previous payment detected</strong>

          <span>
            {initialOrder.payment.provider} · {initialOrder.payment.status}
          </span>

          <small>
            Choosing the same provider resumes the existing session when it is
            still open.
          </small>
        </div>
      ) : null}

      <div className="payment-provider-list">
        {billplzEnabled ? (
          <button
            className="payment-provider-option"
            type="button"
            disabled={Boolean(busyProvider)}
            onClick={() => prepare("BILLPLZ")}
          >
            <div>
              <strong>FPX Online Banking</strong>
              <span>Pay from a Malaysian bank through Billplz</span>
            </div>

            <strong>
              {busyProvider === "BILLPLZ" ? "Connecting…" : "Choose bank →"}
            </strong>
          </button>
        ) : null}

        {stripeEnabled ? (
          <button
            className="payment-provider-option"
            type="button"
            disabled={Boolean(busyProvider)}
            onClick={() => prepare("STRIPE")}
          >
            <div>
              <strong>Stripe Checkout</strong>
              <span>Resume or open the hosted secure payment page</span>
            </div>

            <strong>
              {busyProvider === "STRIPE" ? "Checking…" : "Continue →"}
            </strong>
          </button>
        ) : null}
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="payment-recovery-actions">
        <Link
          className="button"
          href={`/orders/${encodeURIComponent(initialOrder.orderNumber)}`}
        >
          Back to order
        </Link>
      </div>

      <small className="payment-card__notice">
        Payment redirects never mark an order paid. Final payment state remains
        server-owned and provider-verified.
      </small>
    </section>
  );
}
