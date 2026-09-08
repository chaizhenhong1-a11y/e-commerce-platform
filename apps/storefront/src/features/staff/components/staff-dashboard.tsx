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

  const operationCards = data
    ? [
        ["Total orders", data.totalOrders],
        ["Ready to fulfill", data.readyToFulfill],
        ["Awaiting payment", data.awaitingPayment],
        ["Delivered / fulfilled", data.fulfilled],
        ["Active returns", data.activeReturns],
        ["Refund processing", data.refundProcessing],
        ["Low stock variants", data.lowStockVariants],
      ]
    : [];

  const salesCards = useMemo(() => {
    if (!data) return [];
    return [
      ["Today net sales", money(data.currency, data.todayNetSalesCents)],
      ["Today orders", String(data.todayOrders)],
      ["Today refunds", money(data.currency, data.todayRefundsCents)],
      ["Month net sales", money(data.currency, data.monthNetSalesCents)],
      ["Month gross sales", money(data.currency, data.monthGrossSalesCents)],
      ["Average order value", money(data.currency, data.averageOrderValueCents)],
    ];
  }, [data]);

  return (
    <main className={styles.shell}>
      <StaffNav active="overview" />
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>STAFF CONSOLE</span>
          <h1>Commerce operations</h1>
          <p>Real sales, fulfillment, returns, refunds, and inventory from one operational view.</p>
        </div>
      </header>

      {error ? <div className={styles.error}>{error}</div> : null}
      {!data && !error ? <div className={styles.empty}>Loading operations…</div> : null}

      {data ? (
        <>
          <section className={styles.metrics}>
            {salesCards.map(([label, value]) => (
              <div className={styles.metric} key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <section className={styles.metrics}>
            {operationCards.map(([label, value]) => (
              <div className={styles.metric} key={String(label)}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <section className={styles.quick}>
            <Link href="/staff/orders">Open order operations →</Link>
            <Link href="/staff/catalog">Manage products & inventory →</Link>
            <Link href="/staff/returns">Open return operations →</Link>
            <Link href="/staff/settings">Store settings →</Link>
          </section>
        </>
      ) : null}
    </main>
  );
}
