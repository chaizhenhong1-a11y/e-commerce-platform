"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { StaffOrder } from "../domain/staff-order";
import { StaffNav } from "./staff-nav";
import styles from "./staff-console.module.css";

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function StaffOrderDetail({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<StaffOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/staff/orders?q=${encodeURIComponent(orderNumber)}`,
          { cache: "no-store" },
        );
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load order.");
        }

        const orders = Array.isArray(payload) ? (payload as StaffOrder[]) : [];
        const exact = orders.find(
          (item) => item.orderNumber.toLowerCase() === orderNumber.toLowerCase(),
        );

        if (!cancelled) {
          if (!exact) {
            setOrder(null);
            setError("Order not found.");
          } else {
            setOrder(exact);
          }
        }
      } catch (reason) {
        if (!cancelled) {
          setOrder(null);
          setError(
            reason instanceof Error ? reason.message : "Unable to load order.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return (
    <main className={styles.shell}>
      <StaffNav active="orders" />

      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>ORDER DETAIL</span>
          <h1>{orderNumber}</h1>
          <p>Staff-only order information, fulfillment state, and customer details.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.secondaryLink} href="/staff/orders">
            ← Back to orders
          </Link>
        </div>
      </header>

      {loading ? <div className={styles.empty}>Loading order…</div> : null}
      {error ? <div className={styles.error}>{error}</div> : null}

      {order ? (
        <div className={styles.list}>
          <section className={styles.order}>
            <div className={styles.orderTop}>
              <div>
                <h2>{order.customerName}</h2>
                <p>
                  {order.email} ·{" "}
                  {new Date(order.createdAt).toLocaleString("en-MY")}
                </p>
              </div>
              <div className={styles.badges}>
                <span>{order.status}</span>
                <span>{order.paymentStatus}</span>
              </div>
            </div>

            <div className={styles.orderBody}>
              <div>
                <strong>
                  {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                </strong>
                <p>Order {order.orderNumber}</p>
              </div>
              <strong className={styles.total}>
                {money(order.totalCents, order.currency)}
              </strong>
            </div>

            <div className={styles.variantList}>
              {order.items.map((item) => (
                <div className={styles.variantRow} key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <p>{item.variantName}</p>
                  </div>
                  <div className={styles.stock}>
                    <strong>{item.sku}</strong>
                    <span>SKU</span>
                  </div>
                  <div className={styles.stock}>
                    <strong>× {item.quantity}</strong>
                    <span>Quantity</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.order}>
            <div className={styles.orderTop}>
              <div>
                <h2>Fulfillment & delivery</h2>
                <p>Operational history for this order.</p>
              </div>
            </div>

            {order.processingAt ? (
              <p className={styles.signal}>
                Processing since{" "}
                {new Date(order.processingAt).toLocaleString("en-MY")}
              </p>
            ) : (
              <p className={styles.signal}>Processing has not started.</p>
            )}

            {order.trackingNumber ? (
              <p className={styles.signal}>
                Delivery: {order.courierName ?? "Courier"} ·{" "}
                {order.trackingNumber}
                {order.trackingUrl ? (
                  <>
                    {" "}
                    ·{" "}
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Track parcel
                    </a>
                  </>
                ) : null}
              </p>
            ) : (
              <p className={styles.signal}>No tracking information yet.</p>
            )}

            {order.shippedAt ? (
              <p className={styles.signal}>
                Shipped {new Date(order.shippedAt).toLocaleString("en-MY")}
              </p>
            ) : null}

            {order.deliveredAt ? (
              <p className={styles.signal}>
                Delivered {new Date(order.deliveredAt).toLocaleString("en-MY")}
              </p>
            ) : null}

            {order.latestReturn ? (
              <p className={styles.signal}>
                Latest return: {order.latestReturn.status}
              </p>
            ) : null}

            {order.latestRefund ? (
              <p className={styles.signal}>
                Latest refund: {order.latestRefund.status} ·{" "}
                {money(order.latestRefund.amountCents, order.currency)}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </main>
  );
}
