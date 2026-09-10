"use client";

import { useCallback, useEffect, useState } from "react";
import { StaffNav } from "./staff-nav";
import styles from "./staff-console.module.css";

type RefundCase = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  reason: string;
  customerNote: string | null;
  amountCents: number;
  currency: string;
  status: string;
  provider: string;
  requestedAt: string;
  failureMessage: string | null;
};

const statuses = ["REQUESTED", "ALL", "PROCESSING", "REFUNDED", "REJECTED", "FAILED"];

function money(item: RefundCase) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: item.currency,
  }).format(item.amountCents / 100);
}

export function RefundsConsole() {
  const [status, setStatus] = useState("REQUESTED");
  const [items, setItems] = useState<RefundCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = status === "ALL" ? "" : `?status=${encodeURIComponent(status)}`;
      const response = await fetch(`/api/staff/refunds${query}`, { cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "Unable to load refunds.");
      setItems(Array.isArray(body) ? body : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load refunds.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function action(item: RefundCase, kind: "approve" | "reject") {
    let note = "";
    if (kind === "approve") {
      if (
        !window.confirm(
          `Approve ${money(item)} refund for ${item.orderNumber}? This sends the refund to the original payment provider.`,
        )
      ) {
        return;
      }
    } else {
      note = window.prompt("Reason / staff note for rejection:", "") ?? "";
      if (note === "" && !window.confirm("Reject without a note?")) return;
    }

    setBusy(item.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/staff/refunds/${encodeURIComponent(item.id)}/${kind}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ note }),
        },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "Refund action failed.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Refund action failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className={styles.shell}>
      <StaffNav active="refunds" />
      <section className={styles.staffWorkspace}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>REFUND REVIEW</span>
            <h1>Refund approvals</h1>
            <p>Review direct customer refund requests before money is sent back to the original payment provider.</p>
          </div>
        </header>

        <div className={styles.operationsToolbar}>
          <label className={styles.filterField}>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {statuses.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <div className={styles.toolbarSpacer} />
          <button className={styles.secondaryLink} onClick={() => void load()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}
        {loading ? <div className={styles.empty}>Loading refunds…</div> : null}
        {!loading && items.length === 0 ? (
          <div className={styles.empty}>No refund requests match this filter.</div>
        ) : null}

        <div className={styles.list}>
          {items.map((item) => (
            <article className={styles.order} key={item.id}>
              <div className={styles.orderTop}>
                <div>
                  <h2>{item.orderNumber}</h2>
                  <p>{item.customerName} · {item.email}</p>
                </div>
                <div className={styles.badges}><span>{item.status}</span></div>
              </div>

              <div className={styles.orderBody}>
                <div>
                  <strong>{item.reason}</strong>
                  <p>{item.customerNote || "No customer note."}</p>
                  <p>{item.provider} · {new Date(item.requestedAt).toLocaleString("en-MY")}</p>
                  {item.failureMessage ? <p>{item.failureMessage}</p> : null}
                </div>
                <strong className={styles.total}>{money(item)}</strong>
              </div>

              {item.status === "REQUESTED" ? (
                <div className={styles.reviewActions}>
                  <button
                    className={styles.dangerButton}
                    disabled={busy === item.id}
                    onClick={() => void action(item, "reject")}
                  >
                    Reject
                  </button>
                  <button
                    className={styles.primaryAction}
                    disabled={busy === item.id}
                    onClick={() => void action(item, "approve")}
                  >
                    {busy === item.id ? "Working…" : "Approve refund"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
