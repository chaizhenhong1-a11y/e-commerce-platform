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

function statusLabel(value: string) {
  return value.toLowerCase().replace(/(^|\s|_)\S/g, (match) => match.replace("_", " ").toUpperCase());
}

function productImage(product: StaffProduct) {
  const images = [...(product.images ?? [])].sort(
    (left, right) =>
      Number(right.isPrimary) - Number(left.isPrimary) ||
      left.sortOrder - right.sortOrder,
  );
  return (
    images.find((image) => image.variantId === null && image.isPrimary) ??
    images.find((image) => image.isPrimary) ??
    images.find((image) => image.variantId === null) ??
    images[0] ??
    null
  );
}

export function StaffCatalogConsole() {
  const [products, setProducts] = useState<StaffProduct[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ACTIVE");
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

  const summary = useMemo(() => {
    const variants = products.flatMap((product) => product.variants);
    const available = variants.reduce((sum, variant) => {
      const qty = variant.inventory?.quantity ?? 0;
      const reserved = variant.inventory?.reserved ?? 0;
      return sum + Math.max(0, qty - reserved);
    }, 0);
    const lowStock = variants.filter((variant) => {
      const qty = variant.inventory?.quantity ?? 0;
      const reserved = variant.inventory?.reserved ?? 0;
      return Math.max(0, qty - reserved) <= 5;
    }).length;
    return {
      products: products.length,
      active: products.filter((product) => product.status === "ACTIVE").length,
      variants: variants.length,
      available,
      lowStock,
    };
  }, [products]);

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
      <div className={`${styles.staffWorkspace} ${styles.catalogWorkspace}`}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>PRODUCTS</span>
            <h1>Catalog</h1>
            <p>Manage product visibility, media, variants, pricing, and stock from one workspace.</p>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.secondaryLink} href="/staff/inventory">Open inventory</Link>
            <Link className={styles.primaryLink} href="/staff/catalog/new">Add product</Link>
          </div>
        </header>

        <nav className={styles.catalogLifecycleTabs} aria-label="Catalog lifecycle">
          {[
            ["ACTIVE", "Active catalog"],
            ["DRAFT", "Drafts"],
            ["ARCHIVED", "Archived"],
            ["ALL", "All products"],
          ].map(([value, label]) => (
            <button
              className={status === value ? styles.catalogLifecycleActive : ""}
              key={value}
              type="button"
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </nav>

        <section className={styles.catalogSummary} aria-label="Catalog summary">
          <div><span>Products shown</span><strong>{summary.products}</strong></div>
          <div><span>Active</span><strong>{summary.active}</strong></div>
          <div><span>SKUs</span><strong>{summary.variants}</strong></div>
          <div><span>Available units</span><strong>{summary.available}</strong></div>
          <div><span>Low stock SKUs</span><strong>{summary.lowStock}</strong></div>
        </section>

        <form className={`${styles.toolbar} ${styles.catalogToolbar}`} onSubmit={submit}>
          <label className={styles.catalogSearch}>
            <span>Search catalog</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Product name, slug, or SKU" />
          </label>
          <label>
            <span>Lifecycle</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">Active catalog</option>
              <option value="DRAFT">Drafts</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">All products</option>
            </select>
          </label>
          <label className={styles.catalogStockFilter}>
            <input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} />
            <span>Low stock only</span>
          </label>
          <button type="submit">Apply</button>
        </form>

        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <div className={styles.catalogResultHeader}>
          <div>
            <strong>{products.length} product{products.length === 1 ? "" : "s"}</strong>
            <span>Products matching the current filters</span>
          </div>
          <button type="button" onClick={() => void load()}>Refresh</button>
        </div>

        <section className={styles.catalogGrid}>
          {products.map((product) => {
            const image = productImage(product);
            const variants = product.variants;
            const available = variants.reduce((sum, variant) => {
              const qty = variant.inventory?.quantity ?? 0;
              const reserved = variant.inventory?.reserved ?? 0;
              return sum + Math.max(0, qty - reserved);
            }, 0);
            const reserved = variants.reduce(
              (sum, variant) => sum + (variant.inventory?.reserved ?? 0),
              0,
            );
            const startingPrice = variants.length
              ? Math.min(...variants.map((variant) => variant.priceCents))
              : 0;
            const currency = variants[0]?.currency ?? "MYR";

            return (
              <article className={styles.catalogCard} key={product.id}>
                <div className={styles.catalogMedia}>
                  {image ? (
                    // Catalog media may come from the local API media host or an external source.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image.url} alt={image.altText || product.name} loading="lazy" />
                  ) : (
                    <div className={styles.catalogNoImage}>No image</div>
                  )}
                  <div className={styles.catalogMediaBadges}>
                    <span>{statusLabel(product.status)}</span>
                    {product.isFeatured ? <span>Featured</span> : null}
                  </div>
                </div>

                <div className={styles.catalogCardBody}>
                  <div className={styles.catalogIdentity}>
                    <div>
                      <h2>{product.name}</h2>
                      <p>{product.category?.name ?? "Uncategorised"} · /{product.slug}</p>
                    </div>
                    <strong>{variants.length ? `From ${money(startingPrice, currency)}` : "No variants"}</strong>
                  </div>

                  <div className={styles.catalogFacts}>
                    <div><span>SKUs</span><strong>{variants.length}</strong></div>
                    <div><span>Available</span><strong>{available}</strong></div>
                    <div><span>Reserved</span><strong>{reserved}</strong></div>
                  </div>

                  <div className={styles.catalogCardActions}>
                    <Link className={styles.primaryLink} href={`/staff/catalog/${product.id}`}>Edit product</Link>
                    <button
                      disabled={busy !== null}
                      onClick={() => void mutate(
                        `p-${product.id}`,
                        `/api/staff/catalog/products/${product.id}`,
                        "PATCH",
                        { status: product.status === "ACTIVE" ? "DRAFT" : "ACTIVE" },
                        `${product.name} ${product.status === "ACTIVE" ? "unpublished" : "published"}.`,
                      )}
                    >
                      {product.status === "ACTIVE" ? "Unpublish" : "Publish"}
                    </button>
                    <button
                      disabled={busy !== null}
                      onClick={() => void mutate(
                        `f-${product.id}`,
                        `/api/staff/catalog/products/${product.id}`,
                        "PATCH",
                        { isFeatured: !product.isFeatured },
                      )}
                    >
                      {product.isFeatured ? "Remove featured" : "Feature"}
                    </button>
                  </div>

                  <details className={styles.catalogVariants}>
                    <summary>
                      <span>Variants & stock</span>
                      <strong>{variants.length} SKU{variants.length === 1 ? "" : "s"}</strong>
                    </summary>
                    <div className={styles.catalogVariantList}>
                      {variants.map((variant) => {
                        const qty = variant.inventory?.quantity ?? 0;
                        const res = variant.inventory?.reserved ?? 0;
                        const variantAvailable = Math.max(0, qty - res);
                        return (
                          <div className={styles.catalogVariantRow} key={variant.id}>
                            <div>
                              <strong>{variant.name}</strong>
                              <span>{variant.sku} · {money(variant.priceCents, variant.currency)}</span>
                            </div>
                            <div className={styles.catalogVariantStock}>
                              <strong>{variantAvailable} available</strong>
                              <span>{qty} on hand · {res} reserved</span>
                            </div>
                            <div className={styles.catalogVariantActions}>
                              <button
                                disabled={busy !== null}
                                onClick={() => void mutate(
                                  `v-${variant.id}`,
                                  `/api/staff/catalog/variants/${variant.id}`,
                                  "PATCH",
                                  { isActive: !variant.isActive },
                                )}
                              >
                                {variant.isActive ? "Disable SKU" : "Enable SKU"}
                              </button>
                              <button disabled={busy !== null} onClick={() => void openAdjustment(variant)}>
                                Adjust stock
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              </article>
            );
          })}
        </section>

        {!products.length && !error ? (
          <div className={styles.empty}>
            <strong>No products found.</strong>
            <span>Try another status, remove the low-stock filter, or create a new product.</span>
          </div>
        ) : null}

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
                  <button type="submit" disabled={busy !== null || !adjustmentPreview || !reason.trim() || (adjustmentPreview?.next ?? 0) < (adjustmentPreview?.reserved ?? 0)}>
                    {busy === `stock-${adjusting.id}` ? "Saving…" : "Apply adjustment"}
                  </button>
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
      </div>
    </main>
  );
}
