"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { StaffOrder } from "../domain/staff-order";
import { StaffNav } from "./staff-nav";
import styles from "./staff-console.module.css";

const STATUSES = [
  "ALL",
  "AWAITING_PAYMENT",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "FULFILLED",
  "CANCELLED",
  "EXPIRED",
] as const;
const PAYMENTS = ["ALL", "PENDING", "PAID", "PARTIALLY_REFUNDED", "REFUNDED", "FAILED"] as const;

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(cents / 100);
}

type ShippingDraft = {
  orderNumber: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
};

export function OrdersConsole() {
  const [status, setStatus] = useState("ALL");
  const [payment, setPayment] = useState("ALL");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shipping, setShipping] = useState<ShippingDraft | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (payment !== "ALL") params.set("paymentStatus", payment);
    if (appliedQuery) params.set("q", appliedQuery);
    try {
      const response = await fetch(`/api/staff/orders?${params}`, { cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setOrders([]);
        setError(body?.message ?? "Unable to load orders.");
      } else {
        setOrders(body);
      }
    } catch {
      setOrders([]);
      setError("Unable to reach the order service.");
    } finally {
      setLoading(false);
    }
  }, [status, payment, appliedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  function submit(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(query.trim());
  }

  async function transition(order: StaffOrder, action: "process" | "deliver") {
    setBusy(order.orderNumber);
    setError(null);
    try {
      const response = await fetch(
        `/api/staff/orders/${encodeURIComponent(order.orderNumber)}/${action}`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) setError(body?.message ?? `Unable to ${action} order.`);
      else await load();
    } catch {
      setError(`Unable to ${action} order because the order service could not be reached.`);
    } finally {
      setBusy(null);
    }
  }

  async function ship(event: FormEvent) {
    event.preventDefault();
    if (!shipping) return;
    const courierName = shipping.courierName.trim();
    const trackingNumber = shipping.trackingNumber.trim();
    const trackingUrl = shipping.trackingUrl.trim();

    if (!courierName || !trackingNumber) {
      setError("Courier and tracking number are required before shipping.");
      return;
    }

    setBusy(shipping.orderNumber);
    setError(null);
    try {
      const response = await fetch(
        `/api/staff/orders/${encodeURIComponent(shipping.orderNumber)}/ship`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            courierName,
            trackingNumber,
            trackingUrl: trackingUrl || undefined,
          }),
        },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.message ?? "Unable to mark order as shipped.");
      } else {
        setShipping(null);
        await load();
      }
    } catch {
      setError("Unable to mark order as shipped because the order service could not be reached.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className={styles.shell}>
      <StaffNav active="orders" />
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>ORDER OPERATIONS</span>
          <h1>Orders & delivery</h1>
          <p>Advance paid orders from confirmed to processing, shipped and delivered.</p>
        </div>
      </header>

      <form className={styles.toolbar} onSubmit={submit}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order, customer, product or SKU" />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {STATUSES.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={payment} onChange={(event) => setPayment(event.target.value)}>
          {PAYMENTS.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button type="submit">Search</button>
        <button type="button" onClick={() => void load()}>Refresh</button>
      </form>

      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? <div className={styles.empty}>Loading orders…</div> : null}
      {!loading && !orders.length ? <div className={styles.empty}>No orders match these filters.</div> : null}

      <div className={styles.list}>
        {orders.map((order) => (
          <article className={styles.order} key={order.orderNumber}>
            <div className={styles.orderTop}>
              <div>
                <h2>{order.orderNumber}</h2>
                <p>{order.customerName} · {order.email} · {new Date(order.createdAt).toLocaleString("en-MY")}</p>
              </div>
              <div className={styles.badges}><span>{order.status}</span><span>{order.paymentStatus}</span></div>
            </div>
            <div className={styles.orderBody}>
              <div>
                <strong>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</strong>
                {order.items.slice(0, 3).map((item) => (
                  <p key={item.id}>{item.productName} · {item.variantName} · {item.sku} × {item.quantity}</p>
                ))}
              </div>
              <strong className={styles.total}>{money(order.totalCents, order.currency)}</strong>
            </div>

            {order.processingAt ? (
              <p className={styles.signal}>Processing since {new Date(order.processingAt).toLocaleString("en-MY")}</p>
            ) : null}
            {order.trackingNumber ? (
              <p className={styles.signal}>
                Delivery: {order.courierName} · {order.trackingNumber}
                {order.trackingUrl ? <> · <a href={order.trackingUrl} target="_blank" rel="noreferrer">Track parcel</a></> : null}
              </p>
            ) : null}
            {order.shippedAt ? (
              <p className={styles.signal}>Shipped {new Date(order.shippedAt).toLocaleString("en-MY")}</p>
            ) : null}
            {order.deliveredAt ? (
              <p className={styles.signal}>Delivered {new Date(order.deliveredAt).toLocaleString("en-MY")}</p>
            ) : null}
            {order.latestReturn ? <p className={styles.signal}>Return: {order.latestReturn.status}</p> : null}
            {order.latestRefund ? <p className={styles.signal}>Refund: {order.latestRefund.status} · {money(order.latestRefund.amountCents, order.currency)}</p> : null}

            <div className={styles.actions}>
              <Link href={`/staff/orders/${encodeURIComponent(order.orderNumber)}`}>View order</Link>
              {order.canProcess ? (
                <button disabled={busy === order.orderNumber} onClick={() => void transition(order, "process")}>Start processing</button>
              ) : null}
              {order.canShip ? (
                <button
                  disabled={busy === order.orderNumber}
                  onClick={() => setShipping({ orderNumber: order.orderNumber, courierName: "", trackingNumber: "", trackingUrl: "" })}
                >
                  Ship order
                </button>
              ) : null}
              {order.canDeliver ? (
                <button disabled={busy === order.orderNumber} onClick={() => void transition(order, "deliver")}>Mark delivered</button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {shipping ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setShipping(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="shipping-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>SHIP ORDER</span>
                <h2 id="shipping-title">Add tracking details</h2>
                <p>{shipping.orderNumber}</p>
              </div>
              <button className={styles.iconButton} type="button" aria-label="Close" onClick={() => setShipping(null)}>×</button>
            </div>
            <form className={styles.adjustmentForm} onSubmit={(event) => void ship(event)}>
              <label>
                Courier
                <input required value={shipping.courierName} onChange={(event) => setShipping({ ...shipping, courierName: event.target.value })} placeholder="J&T Express" />
              </label>
              <label>
                Tracking number
                <input required value={shipping.trackingNumber} onChange={(event) => setShipping({ ...shipping, trackingNumber: event.target.value })} placeholder="MY123456789" />
              </label>
              <label>
                Tracking URL <span className={styles.muted}>(optional)</span>
                <input type="url" value={shipping.trackingUrl} onChange={(event) => setShipping({ ...shipping, trackingUrl: event.target.value })} placeholder="https://..." />
              </label>
              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} type="button" onClick={() => setShipping(null)}>Cancel</button>
                <button type="submit" disabled={busy === shipping.orderNumber}>Mark shipped</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
