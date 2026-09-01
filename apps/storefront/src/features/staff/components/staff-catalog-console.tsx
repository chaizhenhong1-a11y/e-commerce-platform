"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  StaffInventoryAdjustment,
  StaffProduct,
  StaffVariant,
} from "../domain/staff-catalog";
import { StaffNav } from "./staff-nav";
import styles from "./staff-console.module.css";

const money = (c: number, currency: string) =>
  new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(c / 100);

export function StaffCatalogConsole() {
  const [products, setProducts] = useState<StaffProduct[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [low, setLow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<StaffVariant | null>(null);
  const [deltaText, setDeltaText] = useState("1");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<StaffInventoryAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status !== "ALL") p.set("status", status);
    if (low) p.set("lowStock", "true");
    const r = await fetch(`/api/staff/catalog?${p}`, { cache: "no-store" });
    const body = await r.json().catch(() => null);
    if (!r.ok) {
      setError(body?.message ?? "Unable to load catalog.");
      return;
    }
    setProducts(body ?? []);
  }, [q, status, low]);

  useEffect(() => {
    void load();
  }, [load]);

  async function mutate(
    key: string,
    url: string,
    method: string,
    body: unknown,
    successMessage?: string,
  ) {
    setBusy(key);
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await r.json().catch(() => null);
      if (!r.ok) throw new Error(payload?.message ?? "Operation failed.");
      await load();
      if (successMessage) setSuccess(successMessage);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation failed.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    void load();
  }

  async function openAdjustment(variant: StaffVariant) {
    setAdjusting(variant);
    setDeltaText("1");
    setReason("");
    setHistory([]);
    setError(null);
    setSuccess(null);
    setHistoryLoading(true);
    try {
      const response = await fetch(
        `/api/staff/catalog/variants/${variant.id}/inventory/history`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to load adjustment history.");
      setHistory(Array.isArray(payload) ? payload : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load adjustment history.");
    } finally {
      setHistoryLoading(false);
    }
  }

  const adjustmentPreview = useMemo(() => {
    if (!adjusting) return null;
    const delta = Number(deltaText);
    if (!Number.isInteger(delta) || delta === 0) return null;
    const current = adjusting.inventory?.quantity ?? 0;
    const reserved = adjusting.inventory?.reserved ?? 0;
    return { delta, current, reserved, next: current + delta };
  }, [adjusting, deltaText]);

  async function submitAdjustment(e: FormEvent) {
    e.preventDefault();
    if (!adjusting) return;
    const delta = Number(deltaText);
    if (!Number.isInteger(delta) || delta === 0) {
      setError("Enter a non-zero whole-number adjustment.");
      return;
    }
    if (!reason.trim()) {
      setError("Inventory adjustment reason is required.");
      return;
    }

    const ok = await mutate(
      `stock-${adjusting.id}`,
      `/api/staff/catalog/variants/${adjusting.id}/inventory/adjust`,
      "POST",
      { delta, reason: reason.trim() },
      `${adjusting.sku} inventory adjusted ${delta > 0 ? "+" : ""}${delta}.`,
    );

    if (ok) {
      setAdjusting(null);
      setReason("");
      setDeltaText("1");
    }
  }

  return (
    <main className={styles.shell}>
      <StaffNav active="catalog" />
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>STAFF CATALOG</span>
          <h1>Products & inventory</h1>
          <p>Control storefront availability, product data, variants, media, and audited stock adjustments.</p>
        </div>
        <div className={styles.headerActions}>
          <Link className={styles.primaryLink} href="/staff/catalog/new">Create product</Link>
        </div>
      </header>

      <form className={styles.toolbar} onSubmit={submit}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Product, slug, or SKU" />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>ALL</option><option>ACTIVE</option><option>DRAFT</option><option>ARCHIVED</option>
        </select>
        <label className={styles.check}>
          <input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} /> Low stock only
        </label>
        <button>Refresh</button>
      </form>

      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}

      <section className={styles.list}>
        {products.map((product) => (
          <article className={styles.order} key={product.id}>
            <div className={styles.orderTop}>
              <div><h2>{product.name}</h2><p>{product.category?.name ?? "Uncategorised"} · /{product.slug}</p></div>
              <div className={styles.badges}><span>{product.status}</span>{product.isFeatured ? <span>FEATURED</span> : null}</div>
            </div>
            <div className={styles.actions}>
              <Link href={`/staff/catalog/${product.id}`}>Edit product</Link>
              <button disabled={busy !== null} onClick={() => void mutate(`p-${product.id}`, `/api/staff/catalog/products/${product.id}`, "PATCH", { status: product.status === "ACTIVE" ? "DRAFT" : "ACTIVE" })}>{product.status === "ACTIVE" ? "Unpublish" : "Publish"}</button>
              <button disabled={busy !== null} onClick={() => void mutate(`f-${product.id}`, `/api/staff/catalog/products/${product.id}`, "PATCH", { isFeatured: !product.isFeatured })}>{product.isFeatured ? "Remove featured" : "Feature product"}</button>
            </div>
            <div className={styles.variantList}>
              {product.variants.map((v) => {
                const qty = v.inventory?.quantity ?? 0;
                const res = v.inventory?.reserved ?? 0;
                const available = Math.max(0, qty - res);
                return (
                  <div className={styles.variantRow} key={v.id}>
                    <div><strong>{v.name}</strong><p>{v.sku} · {money(v.priceCents, v.currency)}</p></div>
                    <div className={styles.stock}><strong>{available} available</strong><span>{qty} on hand · {res} reserved</span></div>
                    <div className={styles.actions}>
                      <button disabled={busy !== null} onClick={() => void mutate(`v-${v.id}`, `/api/staff/catalog/variants/${v.id}`, "PATCH", { isActive: !v.isActive })}>{v.isActive ? "Disable SKU" : "Enable SKU"}</button>
                      <button disabled={busy !== null} onClick={() => void openAdjustment(v)}>Adjust stock</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
      {!products.length && !error ? <div className={styles.empty}>No products match these filters.</div> : null}

      {adjusting ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && busy === null) setAdjusting(null); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="inventory-adjustment-title">
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>INVENTORY ADJUSTMENT</span>
                <h2 id="inventory-adjustment-title">{adjusting.sku}</h2>
                <p>{adjusting.name}</p>
              </div>
              <button className={styles.iconButton} type="button" disabled={busy !== null} onClick={() => setAdjusting(null)} aria-label="Close">×</button>
            </div>

            <form className={styles.adjustmentForm} onSubmit={submitAdjustment}>
              <label>
                <span>Quantity change</span>
                <input inputMode="numeric" value={deltaText} onChange={(e) => setDeltaText(e.target.value)} placeholder="e.g. 10 or -5" autoFocus />
              </label>
              <label>
                <span>Reason</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={160} placeholder="e.g. Supplier delivery received" rows={3} />
                <small>{reason.length}/160</small>
              </label>

              <div className={styles.inventoryPreview}>
                <div><span>On hand</span><strong>{adjustmentPreview?.current ?? (adjusting.inventory?.quantity ?? 0)}</strong></div>
                <div><span>Reserved</span><strong>{adjustmentPreview?.reserved ?? (adjusting.inventory?.reserved ?? 0)}</strong></div>
                <div><span>After adjustment</span><strong>{adjustmentPreview?.next ?? "—"}</strong></div>
              </div>

              {adjustmentPreview && adjustmentPreview.next < adjustmentPreview.reserved ? (
                <div className={styles.error}>Result cannot be below reserved stock ({adjustmentPreview.reserved}).</div>
              ) : null}

              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} disabled={busy !== null} onClick={() => setAdjusting(null)}>Cancel</button>
                <button type="submit" disabled={busy !== null || !adjustmentPreview || !reason.trim() || (adjustmentPreview?.next ?? 0) < (adjustmentPreview?.reserved ?? 0)}>{busy === `stock-${adjusting.id}` ? "Saving…" : "Apply adjustment"}</button>
              </div>
            </form>

            <div className={styles.historyBlock}>
              <h3>Recent adjustment history</h3>
              {historyLoading ? <p className={styles.muted}>Loading history…</p> : null}
              {!historyLoading && history.length === 0 ? <p className={styles.muted}>No inventory adjustments recorded yet.</p> : null}
              {history.slice(0, 8).map((item) => (
                <div className={styles.historyRow} key={item.id}>
                  <div><strong>{item.delta > 0 ? "+" : ""}{item.delta}</strong><span>{item.previousQuantity} → {item.newQuantity}</span></div>
                  <div className={styles.historyReason}><strong>{item.reason}</strong><span>{item.actor.firstName} {item.actor.lastName} · {new Date(item.createdAt).toLocaleString("en-MY")}</span></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
