"use client";

import Link from "next/link";
import { useState } from "react";
import {
  confirmDevelopmentPayment,
  createPayment,
} from "../data/payment-api";
import type {
  Payment,
  PaymentProvider,
} from "../domain/payment";

const stripeEnabled =
  process.env.NEXT_PUBLIC_STRIPE_ENABLED === "true";
const developmentPaymentEnabled =
  process.env.NODE_ENV !== "production";

export function PaymentView({
  orderNumber,
}: {
  orderNumber: string;
}) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [busyProvider, setBusyProvider] =
    useState<PaymentProvider | null>(null);
  const [error, setError] = useState("");

  async function prepare(provider: PaymentProvider) {
    if (busyProvider) {
      return;
    }

    setBusyProvider(provider);
    setError("");

    try {
      const created = await createPayment(orderNumber, provider);

      if (created.checkoutUrl) {
        window.location.assign(created.checkoutUrl);
        return;
      }

      setPayment(created);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to prepare payment.",
      );
    } finally {
      setBusyProvider(null);
    }
  }

  async function confirmDevelopment() {
    if (
      !payment ||
      payment.provider !== "MANUAL_TEST" ||
      busyProvider
    ) {
      return;
    }

    setBusyProvider("MANUAL_TEST");
    setError("");

    try {
      setPayment(
        await confirmDevelopmentPayment(payment.id, orderNumber),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Payment failed.",
      );
    } finally {
      setBusyProvider(null);
    }
  }

  if (payment?.status === "PAID") {
    return (
      <section className="checkout-success">
        <div className="checkout-success__icon">✓</div>
        <span className="section-kicker">
          PAYMENT COMPLETE
        </span>
        <h2>Order confirmed.</h2>
        <p>
          Payment is complete and the reserved inventory has
          been committed to your order.
        </p>

        <div className="checkout-success__number">
          <span>Order number</span>
          <strong>{orderNumber}</strong>
        </div>

        <div className="checkout-success__actions">
          <Link
            className="button button--primary"
            href={`/orders/${encodeURIComponent(orderNumber)}`}
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

  return (
    <section className="payment-card">
      <span className="section-kicker">PAYMENT</span>
      <h1>Choose how to pay</h1>
      <p>
        TextShop keeps gateway-specific code behind a payment
        provider boundary. Browser redirects never decide whether
        an order is paid; the backend verifies the provider result.
      </p>

      <div className="payment-provider-list">
        {stripeEnabled ? (
          <button
            className="payment-provider-option"
            type="button"
            disabled={Boolean(busyProvider)}
            onClick={() => prepare("STRIPE")}
          >
            <div>
              <strong>Stripe Checkout</strong>
              <span>
                Hosted secure payment page
              </span>
            </div>
            <strong>
              {busyProvider === "STRIPE"
                ? "Preparing…"
                : "Continue →"}
            </strong>
          </button>
        ) : null}

        {developmentPaymentEnabled ? (
          <button
          className="payment-provider-option"
          type="button"
          disabled={Boolean(busyProvider)}
          onClick={() => prepare("MANUAL_TEST")}
        >
          <div>
            <strong>Development payment</strong>
            <span>
              Local testing only · no real money
            </span>
          </div>
          <strong>
            {busyProvider === "MANUAL_TEST"
              ? "Preparing…"
              : "Use test mode"}
          </strong>
        </button>
        ) : null}
      </div>

      {payment?.provider === "MANUAL_TEST" &&
      payment.status === "PENDING" ? (
        <div className="manual-payment-panel">
          <div>
            <span>Test amount</span>
            <strong>
              RM {(payment.amountCents / 100).toFixed(2)}
            </strong>
          </div>

          <button
            className="button button--checkout"
            type="button"
            disabled={Boolean(busyProvider)}
            onClick={confirmDevelopment}
          >
            {busyProvider === "MANUAL_TEST"
              ? "Processing…"
              : "Simulate successful payment"}
          </button>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <small className="payment-card__notice">
        Test payment controls are available only outside production.
        Production payment state must come from an approved provider.
      </small>
    </section>
  );
}
