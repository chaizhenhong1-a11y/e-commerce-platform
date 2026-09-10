"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { StaffCommerceSummary } from "../domain/staff-order";
import { StaffNav } from "./staff-nav";
import styles from "./staff-console.module.css";

function money(currency: string, cents: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StaffDashboard() {
  const [data, setData] = useState<StaffCommerceSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/staff/orders/summary", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.message ?? "Unable to load staff console.");
        }
        setData(payload);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Unable to load staff console.");
      });
  }, []);

  const salesCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: "Today net sales",
        value: money(data.currency, data.todayNetSalesCents),
        detail: `${data.todayOrders} paid order${data.todayOrders === 1 ? "" : "s"} today`,
      },
      {
        label: "Month net sales",
        value: money(data.currency, data.monthNetSalesCents),
        detail: `${data.monthOrders} paid order${data.monthOrders === 1 ? "" : "s"} this month`,
      },
      {
        label: "Average order value",
        value: money(data.currency, data.averageOrderValueCents),
        detail: "Based on paid orders this month",
      },
      {
        label: "Month refunds",
        value: money(data.currency, data.monthRefundsCents),
        detail: "Completed refunds this month",
      },
    ];
  }, [data]);

  const attention = data
    ? [
        {
          label: "Ready to fulfill",
          value: data.readyToFulfill,
          detail: "Paid confirmed orders",
          href: "/staff/orders?status=CONFIRMED&paymentStatus=PAID",
          urgent: data.readyToFulfill > 0,
        },
        {
          label: "Active returns",
          value: data.activeReturns,
          detail: "Returns requiring operations",
          href: "/staff/returns",
          urgent: data.activeReturns > 0,
        },
        {
          label: "Refund requests",
          value: data.pendingRefundRequests,
          detail: "Waiting for staff review",
          href: "/staff/refunds",
          urgent: data.pendingRefundRequests > 0,
        },
        {
          label: "Low stock",
          value: data.lowStockVariants,
          detail: `${data.outOfStockVariants} out of stock`,
          href: "/staff/inventory",
          urgent: data.lowStockVariants > 0,
        },
      ]
    : [];

  return (
    <main className={styles.shell}>
      <StaffNav active="overview" />
      <div className={`${styles.staffWorkspace} ${styles.dashboardWorkspace}`}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>OVERVIEW</span>
            <h1>Store overview</h1>
            <p>Sales, work queues, inventory health, and recent commerce activity in one place.</p>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.secondaryLink} href="/">View store</Link>
            <Link className={styles.primaryLink} href="/staff/catalog/new">Add product</Link>
          </div>
        </header>

        {error ? <div className={styles.error}>{error}</div> : null}
        {!data && !error ? <div className={styles.empty}>Loading store overview…</div> : null}

        {data ? (
          <>
            <section className={styles.dashboardSection}>
              <div className={styles.dashboardSectionHeading}>
                <div>
                  <span className={styles.eyebrow}>PERFORMANCE</span>
                  <h2>Sales snapshot</h2>
                </div>
                <span className={styles.dashboardContext}>{data.timeZone}</span>
              </div>
              <div className={styles.dashboardSalesGrid}>
                {salesCards.map((card) => (
                  <article className={styles.dashboardMetricCard} key={card.label}>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.detail}</small>
                  </article>
                ))}
              </div>
            </section>

            <section className={styles.dashboardSection}>
              <div className={styles.dashboardSectionHeading}>
                <div>
                  <span className={styles.eyebrow}>NEEDS ATTENTION</span>
                  <h2>Operations queue</h2>
                </div>
              </div>
              <div className={styles.dashboardAttentionGrid}>
                {attention.map((item) => (
                  <Link
                    className={`${styles.dashboardAttentionCard} ${item.urgent ? styles.dashboardAttentionUrgent : ""}`}
                    href={item.href}
                    key={item.label}
                  >
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <small>{item.detail}</small>
                    <b>Open →</b>
                  </Link>
                ))}
              </div>
            </section>

            <div className={styles.dashboardColumns}>
              <section className={styles.dashboardPanel}>
                <div className={styles.dashboardPanelHeading}>
                  <div>
                    <span className={styles.eyebrow}>ORDERS</span>
                    <h2>Recent orders</h2>
                  </div>
                  <Link href="/staff/orders">View all</Link>
                </div>
                {data.recentOrders.length ? (
                  <div className={styles.dashboardOrderList}>
                    {data.recentOrders.map((order) => (
                      <Link href={`/staff/orders/${order.orderNumber}`} key={order.orderNumber}>
                        <div>
                          <strong>{order.orderNumber}</strong>
                          <span>{order.customerName}</span>
                        </div>
                        <div className={styles.dashboardOrderMeta}>
                          <strong>{money(order.currency, order.totalCents)}</strong>
                          <span>{order.status.replaceAll("_", " ")} · {shortDate(order.createdAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className={styles.dashboardPanelEmpty}>No orders yet.</div>
                )}
              </section>

              <section className={styles.dashboardPanel}>
                <div className={styles.dashboardPanelHeading}>
                  <div>
                    <span className={styles.eyebrow}>PRODUCTS</span>
                    <h2>Top selling</h2>
                  </div>
                  <Link href="/staff/catalog">Catalog</Link>
                </div>
                {data.topProducts.length ? (
                  <div className={styles.dashboardProductList}>
                    {data.topProducts.map((product, index) => (
                      <div key={product.productName}>
                        <span className={styles.dashboardRank}>{index + 1}</span>
                        <div>
                          <strong>{product.productName}</strong>
                          <span>{product.quantity} unit{product.quantity === 1 ? "" : "s"} sold</span>
                        </div>
                        <strong>{money(data.currency, product.salesCents)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.dashboardPanelEmpty}>Paid sales will appear here.</div>
                )}
              </section>
            </div>

            <section className={styles.dashboardSection}>
              <div className={styles.dashboardSectionHeading}>
                <div>
                  <span className={styles.eyebrow}>SHORTCUTS</span>
                  <h2>Manage your store</h2>
                </div>
              </div>
              <div className={styles.dashboardShortcuts}>
                <Link href="/staff/orders"><strong>Orders</strong><span>{data.totalOrders} total orders</span></Link>
                <Link href="/staff/inventory"><strong>Inventory</strong><span>Stock levels & adjustments</span></Link>
                <Link href="/staff/catalog"><strong>Catalog</strong><span>Products, variants & media</span></Link>
                <Link href="/staff/settings"><strong>Store settings</strong><span>Brand, delivery & policies</span></Link>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
