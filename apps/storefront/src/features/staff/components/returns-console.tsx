"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StaffReturnCase } from "../domain/return-case";
import styles from "./returns-console.module.css";
import staffStyles from "./staff-console.module.css";
import { StaffNav } from "./staff-nav";

const STATUSES = [
  "ALL",
  "REQUESTED",
  "APPROVED",
  "IN_TRANSIT",
  "RECEIVED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

const CONDITIONS = ["UNOPENED", "OPENED", "DAMAGED", "DEFECTIVE"] as const;
const DISPOSITIONS = ["RESTOCK", "QUARANTINE", "DISCARD"] as const;

type InspectionDraft = Record<
  string,
  { condition: (typeof CONDITIONS)[number]; disposition: (typeof DISPOSITIONS)[number] }
>;

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export function ReturnsConsole() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("ALL");
  const [cases, setCases] = useState<StaffReturnCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [inspection, setInspection] = useState<InspectionDraft>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const query = status === "ALL" ? "" : `?status=${encodeURIComponent(status)}`;
    const response = await fetch(`/api/staff/returns${query}`, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setCases([]);
      setError(payload?.message ?? "Unable to load return cases.");
      setLoading(false);
      return;
    }
    setCases(payload as StaffReturnCase[]);
    setLoading(false);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  const inspectionDefaults = useMemo(() => {
    const result: InspectionDraft = {};
    for (const entry of cases) {
      for (const item of entry.items) {
        result[item.id] = {
          condition: item.condition ?? "OPENED",
          disposition: item.disposition ?? "QUARANTINE",
        };
      }
    }
    return result;
  }, [cases]);

  async function action(
    entry: StaffReturnCase,
    name: "approve" | "reject" | "in-transit" | "receive" | "inspect" | "complete",
  ) {
    setBusyId(entry.id);
    setError(null);
    const body =
      name === "approve" || name === "reject"
        ? { note: notes[entry.id] ?? "" }
        : name === "inspect"
          ? {
              items: entry.items.map((item) => {
                const draft = inspection[item.id] ?? inspectionDefaults[item.id];
                return {
                  returnItemId: item.id,
                  condition: draft.condition,
                  disposition: draft.disposition,
                };
              }),
            }
          : {};

    const response = await fetch(`/api/staff/returns/${entry.id}/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setError(payload?.message ?? "Return action failed.");
      setBusyId(null);
      return;
    }
    await load();
    setBusyId(null);
  }

  return (
    <main className={staffStyles.shell}>
      <StaffNav active="returns" />
      <section className={styles.workspace}>
      <div className={styles.header}>
        <div>
          <h1>Returns operations</h1>
          <p>Review, receive, inspect, refund, and disposition returned stock.</p>
        </div>
      </div>

      <div className={styles.toolbar}>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
          {STATUSES.map((value) => <option key={value}>{value}</option>)}
        </select>
        <button type="button" onClick={() => void load()} disabled={loading}>Refresh</button>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {loading ? <div className={styles.empty}>Loading return cases…</div> : null}
      {!loading && cases.length === 0 ? <div className={styles.empty}>No return cases match this filter.</div> : null}

      <div className={styles.grid}>
        {cases.map((entry) => {
          const busy = busyId === entry.id;
          return (
            <article className={styles.card} key={entry.id}>
              <div className={styles.cardTop}>
                <div>
                  <h2>{entry.order.orderNumber}</h2>
                  <div className={styles.meta}>{entry.order.email} · {entry.reason} · {money(entry.order.totalCents, entry.order.currency)}</div>
                </div>
                <span className={styles.badge}>{entry.status}</span>
              </div>

              {entry.customerNote ? <p>{entry.customerNote}</p> : null}
              <div className={styles.items}>
                {entry.items.map((item) => {
                  const draft = inspection[item.id] ?? inspectionDefaults[item.id];
                  return (
                    <div className={styles.item} key={item.id}>
                      <div>
                        <strong>{item.orderItem.productName}</strong>
                        <div className={styles.meta}>{item.orderItem.variantName} · {item.orderItem.sku} · Return qty {item.quantity}</div>
                        {entry.status === "RECEIVED" ? (
                          <div className={styles.inspection}>
                            <select value={draft.condition} onChange={(event) => setInspection((current) => ({ ...current, [item.id]: { ...draft, condition: event.target.value as typeof draft.condition } }))}>
                              {CONDITIONS.map((value) => <option key={value}>{value}</option>)}
                            </select>
                            <select value={draft.disposition} onChange={(event) => setInspection((current) => ({ ...current, [item.id]: { ...draft, disposition: event.target.value as typeof draft.disposition } }))}>
                              {DISPOSITIONS.map((value) => <option key={value}>{value}</option>)}
                            </select>
                          </div>
                        ) : null}
                      </div>
                      <strong>{money(item.orderItem.unitPriceCents * item.quantity, entry.order.currency)}</strong>
                    </div>
                  );
                })}
              </div>

              {entry.refund ? <div className={styles.refund}>Refund: {entry.refund.status} · {money(entry.refund.amountCents, entry.refund.currency)}</div> : null}

              {entry.status === "REQUESTED" ? (
                <textarea className={styles.note} placeholder="Optional staff note" value={notes[entry.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [entry.id]: event.target.value }))} />
              ) : null}

              <div className={styles.actions}>
                {entry.status === "REQUESTED" ? <>
                  <button className={styles.primary} disabled={busy} onClick={() => void action(entry, "approve")}>Approve</button>
                  <button className={styles.danger} disabled={busy} onClick={() => void action(entry, "reject")}>Reject</button>
                </> : null}
                {entry.status === "APPROVED" ? <>
                  <button disabled={busy} onClick={() => void action(entry, "in-transit")}>Mark in transit</button>
                  <button className={styles.primary} disabled={busy} onClick={() => void action(entry, "receive")}>Receive now</button>
                </> : null}
                {entry.status === "IN_TRANSIT" ? <button className={styles.primary} disabled={busy} onClick={() => void action(entry, "receive")}>Mark received</button> : null}
                {entry.status === "RECEIVED" ? <>
                  <button disabled={busy} onClick={() => void action(entry, "inspect")}>Save inspection</button>
                  <button className={styles.primary} disabled={busy} onClick={() => void action(entry, "complete")}>Complete & refund</button>
                </> : null}
              </div>
            </article>
          );
        })}
      </div>
      </section>
    </main>
  );
}
