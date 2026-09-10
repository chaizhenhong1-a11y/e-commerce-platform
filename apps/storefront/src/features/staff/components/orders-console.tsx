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

type OrderPreset =
  | "ALL"
  | "AWAITING_PAYMENT"
  | "READY_TO_FULFILL"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "FULFILLED"
  | "CANCELLED";

const ORDER_PRESETS: Array<{ key: OrderPreset; label: string }> = [
  { key: "ALL", label: "All orders" },
  { key: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { key: "READY_TO_FULFILL", label: "Ready to fulfill" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "FULFILLED", label: "Fulfilled" },
  { key: "CANCELLED", label: "Cancelled" },
];

function statusLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}


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
  const [preset, setPreset] = useState<OrderPreset>("ALL");
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

  function applyPreset(nextPreset: OrderPreset) {
    setPreset(nextPreset);
    if (nextPreset === "ALL") {
      setStatus("ALL");
      setPayment("ALL");
      return;
    }
    if (nextPreset === "READY_TO_FULFILL") {
      setStatus("CONFIRMED");
      setPayment("PAID");
      return;
    }
    setStatus(nextPreset);
    setPayment("ALL");
  }

  function clearFilters() {
    setPreset("ALL");
    setStatus("ALL");
    setPayment("ALL");
    setQuery("");
    setAppliedQuery("");
  }

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
      <section className={styles.staffWorkspace}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>ORDER OPERATIONS</span>
          <h1>Orders</h1>
          <p>Review, fulfill, ship, and track customer orders from one operational queue.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.secondaryButton} type="button" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </header>

      <nav className={styles.orderPresetTabs} aria-label="Order workflow">
        {ORDER_PRESETS.map((item) => (
          <button
            className={preset === item.key ? styles.orderPresetActive : ""}
            key={item.key}
            type="button"
            onClick={() => applyPreset(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <form className={`${styles.toolbar} ${styles.operationsToolbar} ${styles.ordersToolbar}`} onSubmit={submit}>
        <label className={styles.orderSearchField}>
          <span>Search orders</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Order number, customer, product or SKU"
          />
        </label>
        <label>
          <span>Order status</span>
          <select
            value={status}
            onChange={(event) => {
              setPreset("ALL");
              setStatus(event.target.value);
            }}
          >
            {STATUSES.map((item) => <option key={item}>{statusLabel(item)}</option>)}
          </select>
        </label>
        <label>
          <span>Payment status</span>
          <select
            value={payment}
            onChange={(event) => {
              setPreset("ALL");
              setPayment(event.target.value);
            }}
          >
            {PAYMENTS.map((item) => <option key={item}>{statusLabel(item)}</option>)}
          </select>
        </label>
        <button type="submit">Apply</button>
        <button className={styles.secondaryButton} type="button" onClick={clearFilters}>Clear</button>
      </form>

      <div className={styles.orderResultsBar}>
        <div>
          <strong>{loading ? "Loading…" : `${orders.length} order${orders.length === 1 ? "" : "s"}`}</strong>
          <span>
            {preset === "ALL"
              ? "Current search and filters"
              : ORDER_PRESETS.find((item) => item.key === preset)?.label}
          </span>
        </div>
        {(status !== "ALL" || payment !== "ALL" || appliedQuery) ? (
          <button type="button" onClick={clearFilters}>Reset filters</button>
        ) : null}
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? <div className={styles.empty}>Loading orders…</div> : null}
      {!loading && !orders.length ? (
        <div className={styles.empty}>
          <strong>No orders found.</strong>
          <span>Try another workflow tab, clear the filters, or search with a different term.</span>
        </div>
      ) : null}

      <div className={styles.list}>
        {orders.map((order) => (
          <article className={styles.order} key={order.orderNumber}>
            <div className={styles.orderTop}>
              <div>
                <h2>{order.orderNumber}</h2>
                <p>{order.customerName} · {order.email} · {new Date(order.createdAt).toLocaleString("en-MY")}</p>
              </div>
              <div className={styles.orderStatusStack}>
                <span className={styles.orderStatusLabel}>Order</span>
                <div className={styles.badges}><span>{statusLabel(order.status)}</span></div>
                <span className={styles.orderStatusLabel}>Payment</span>
                <div className={styles.badges}><span>{statusLabel(order.paymentStatus)}</span></div>
              </div>
            </div>
            <div className={styles.orderBody}>
              <div>
                <strong>{order.itemCount} item{order.itemCount === 1 ? "" : "s"}</strong>
                <div className={styles.orderItemPreviewList}>
                  {order.items.slice(0, 3).map((item) => (
                    <div className={styles.orderItemPreview} key={item.id}>
                      <div className={styles.orderItemPhoto}>
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt={item.imageAltText || item.productName}
                            loading="lazy"
                          />
                        ) : (
                          <span>No image</span>
                        )}
                      </div>
                      <div>
                        <strong>{item.productName}</strong>
                        <span>{item.variantName} · {item.sku} × {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
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

      </section>

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
