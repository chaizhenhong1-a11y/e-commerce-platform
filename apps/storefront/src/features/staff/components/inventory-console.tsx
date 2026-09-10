"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type {
  StaffImage,
  StaffInventoryAdjustment,
  StaffProduct,
  StaffVariant,
} from "../domain/staff-catalog";
import { StaffNav } from "./staff-nav";
import styles from "./staff-console.module.css";

type InventoryLifecycle = "ACTIVE" | "ARCHIVED";
type StockFilter = "ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

type InventoryRow = {
  productId: string;
  productName: string;
  productStatus: StaffProduct["status"];
  categoryName: string;
  variant: StaffVariant;
  image: StaffImage | null;
  onHand: number;
  reserved: number;
  available: number;
};

const LOW_STOCK_THRESHOLD = 5;

function inventoryImage(
  product: StaffProduct,
  variant: StaffVariant,
): StaffImage | null {
  const images = [...(product.images ?? [])].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    images.find((image) => image.variantId === variant.id && image.isPrimary) ??
    images.find((image) => image.variantId === variant.id) ??
    images.find((image) => image.variantId === null && image.isPrimary) ??
    images.find((image) => image.isPrimary) ??
    images.find((image) => image.variantId === null) ??
    images[0] ??
    null
  );
}

function stockState(row: InventoryRow): Exclude<StockFilter, "ALL"> {
  if (row.available <= 0) return "OUT_OF_STOCK";
  if (row.available <= LOW_STOCK_THRESHOLD) return "LOW_STOCK";
  return "IN_STOCK";
}

function stockLabel(state: Exclude<StockFilter, "ALL">) {
  if (state === "OUT_OF_STOCK") return "Out of stock";
  if (state === "LOW_STOCK") return "Low stock";
  return "In stock";
}

export function InventoryConsole() {
  const [products, setProducts] = useState<StaffProduct[]>([]);
  const [q, setQ] = useState("");
  const [lifecycle, setLifecycle] = useState<InventoryLifecycle>("ACTIVE");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);
  const [deltaText, setDeltaText] = useState("1");
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<StaffInventoryAdjustment[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());

      const response = await fetch(`/api/staff/catalog?${params.toString()}`, {
        cache: "no-store",
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Unable to load inventory.");
      }

      setProducts(Array.isArray(body) ? body : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo<InventoryRow[]>(
    () =>
      products.flatMap((product) =>
        product.variants.map((variant) => {
          const onHand = variant.inventory?.quantity ?? 0;
          const reserved = variant.inventory?.reserved ?? 0;
          return {
            productId: product.id,
            productName: product.name,
            productStatus: product.status,
            categoryName: product.category?.name ?? "Uncategorised",
            variant,
            image: inventoryImage(product, variant),
            onHand,
            reserved,
            available: Math.max(0, onHand - reserved),
          };
        }),
      ),
    [products],
  );

  const lifecycleRows = useMemo(
    () => rows.filter((row) => row.productStatus === lifecycle),
    [rows, lifecycle],
  );

  const visibleRows = useMemo(
    () =>
      lifecycleRows.filter((row) =>
        stockFilter === "ALL" ? true : stockState(row) === stockFilter,
      ),
    [lifecycleRows, stockFilter],
  );

  const summary = useMemo(() => {
    const totalOnHand = lifecycleRows.reduce((sum, row) => sum + row.onHand, 0);
    const totalReserved = lifecycleRows.reduce((sum, row) => sum + row.reserved, 0);
    const lowStock = lifecycleRows.filter(
      (row) => stockState(row) === "LOW_STOCK",
    ).length;
    const outOfStock = lifecycleRows.filter(
      (row) => stockState(row) === "OUT_OF_STOCK",
    ).length;

    return {
      skus: lifecycleRows.length,
      totalOnHand,
      totalReserved,
      lowStock,
      outOfStock,
    };
  }, [lifecycleRows]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    void load();
  }

  async function openAdjustment(row: InventoryRow) {
    setAdjusting(row);
    setDeltaText("1");
    setReason("");
    setHistory([]);
    setError(null);
    setSuccess(null);
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `/api/staff/catalog/variants/${encodeURIComponent(row.variant.id)}/inventory/history`,
        { cache: "no-store" },
      );
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Unable to load inventory history.");
      }

      setHistory(Array.isArray(body) ? body : []);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load inventory history.",
      );
    } finally {
      setHistoryLoading(false);
    }
  }

  const preview = useMemo(() => {
    if (!adjusting) return null;

    const delta = Number(deltaText);
    if (!Number.isInteger(delta) || delta === 0) return null;

    return {
      delta,
      next: adjusting.onHand + delta,
      reserved: adjusting.reserved,
    };
  }, [adjusting, deltaText]);

  async function applyAdjustment(event: FormEvent) {
    event.preventDefault();
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

    setBusy(adjusting.variant.id);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/staff/catalog/variants/${encodeURIComponent(adjusting.variant.id)}/inventory/adjust`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ delta, reason: reason.trim() }),
        },
      );
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.message ?? "Unable to adjust inventory.");
      }

      setSuccess(
        `${adjusting.variant.sku} adjusted ${delta > 0 ? "+" : ""}${delta}.`,
      );
      setAdjusting(null);
      setDeltaText("1");
      setReason("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to adjust inventory.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className={styles.shell}>
      <StaffNav active="inventory" />

      <section className={styles.staffWorkspace}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>INVENTORY CONTROL</span>
            <h1>Inventory</h1>
            <p>
              Monitor sellable stock, reserved units, low-stock SKUs, and audited
              manual adjustments from one workspace.
            </p>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.secondaryLink} href="/staff/catalog">
              Open catalog
            </Link>
          </div>
        </header>

        <div className={styles.inventoryLifecycleTabs} role="tablist" aria-label="Inventory lifecycle">
          <button
            type="button"
            role="tab"
            aria-selected={lifecycle === "ACTIVE"}
            className={lifecycle === "ACTIVE" ? styles.inventoryLifecycleActive : ""}
            onClick={() => {
              setLifecycle("ACTIVE");
              setStockFilter("ALL");
            }}
          >
            Active Inventory
            <span>{rows.filter((row) => row.productStatus === "ACTIVE").length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lifecycle === "ARCHIVED"}
            className={lifecycle === "ARCHIVED" ? styles.inventoryLifecycleActive : ""}
            onClick={() => {
              setLifecycle("ARCHIVED");
              setStockFilter("ALL");
            }}
          >
            Archived
            <span>{rows.filter((row) => row.productStatus === "ARCHIVED").length}</span>
          </button>
        </div>

        <section className={styles.inventoryStats} aria-label="Inventory summary">
          <div>
            <span>Tracked SKUs</span>
            <strong>{summary.skus}</strong>
          </div>
          <div>
            <span>On hand</span>
            <strong>{summary.totalOnHand}</strong>
          </div>
          <div>
            <span>Reserved</span>
            <strong>{summary.totalReserved}</strong>
          </div>
          <div>
            <span>Low stock</span>
            <strong>{summary.lowStock}</strong>
          </div>
          <div>
            <span>Out of stock</span>
            <strong>{summary.outOfStock}</strong>
          </div>
        </section>

        <form
          className={`${styles.operationsToolbar} ${styles.inventoryToolbar}`}
          onSubmit={submitSearch}
        >
          <label className={styles.inventorySearch}>
            <span>Search inventory</span>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Product name, slug, or SKU"
            />
          </label>

          <label className={styles.filterField}>
            <span>Stock state</span>
            <select
              value={stockFilter}
              onChange={(event) =>
                setStockFilter(event.target.value as StockFilter)
              }
            >
              <option value="ALL">All inventory</option>
              <option value="IN_STOCK">In stock</option>
              <option value="LOW_STOCK">Low stock</option>
              <option value="OUT_OF_STOCK">Out of stock</option>
            </select>
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </form>

        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <section className={styles.inventoryTableCard}>
          <div className={styles.inventoryTableHead}>
            <div>Product / SKU</div>
            <div>Status</div>
            <div>On hand</div>
            <div>Reserved</div>
            <div>Available</div>
            <div aria-hidden="true" />
          </div>

          {loading ? (
            <div className={styles.empty}>Loading inventory…</div>
          ) : null}

          {!loading &&
            visibleRows.map((row) => {
              const state = stockState(row);

              return (
                <article className={styles.inventoryRow} key={row.variant.id}>
                  <div className={styles.inventoryProductCell}>
                    <div className={styles.inventoryThumbnail}>
                      {row.image ? (
                        // Product media can be served by the local API media route or an external URL.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={row.image.url}
                          alt={row.image.altText || row.productName}
                          loading="lazy"
                        />
                      ) : (
                        <span aria-label="No product image">No image</span>
                      )}
                    </div>

                    <div className={styles.inventoryIdentity}>
                      <strong>{row.productName}</strong>
                      <span>
                        {row.variant.name} · {row.variant.sku}
                      </span>
                      <small>
                        {row.categoryName} · {row.productStatus}
                      </small>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`${styles.stockBadge} ${
                        state === "OUT_OF_STOCK"
                          ? styles.stockOut
                          : state === "LOW_STOCK"
                            ? styles.stockLow
                            : styles.stockOk
                      }`}
                    >
                      {stockLabel(state)}
                    </span>
                  </div>

                  <div className={styles.inventoryNumber}>
                    <span>On hand</span>
                    <strong>{row.onHand}</strong>
                  </div>

                  <div className={styles.inventoryNumber}>
                    <span>Reserved</span>
                    <strong>{row.reserved}</strong>
                  </div>

                  <div className={styles.inventoryNumber}>
                    <span>Available</span>
                    <strong>{row.available}</strong>
                  </div>

                  <div className={styles.inventoryActions}>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void openAdjustment(row)}
                    >
                      Adjust
                    </button>
                    <Link href={`/staff/catalog/${row.productId}`}>Edit</Link>
                  </div>
                </article>
              );
            })}

          {!loading && visibleRows.length === 0 ? (
            <div className={styles.empty}>
              {lifecycle === "ARCHIVED"
                ? "No archived SKUs match the current inventory filters."
                : "No active SKUs match the current inventory filters."}
            </div>
          ) : null}
        </section>
      </section>

      {adjusting ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && busy === null) {
              setAdjusting(null);
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.eyebrow}>STOCK ADJUSTMENT</span>
                <h2 id="inventory-modal-title">{adjusting.variant.sku}</h2>
                <p>
                  {adjusting.productName} · {adjusting.variant.name}
                </p>
              </div>
              <button
                className={styles.iconButton}
                type="button"
                disabled={busy !== null}
                onClick={() => setAdjusting(null)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form className={styles.adjustmentForm} onSubmit={applyAdjustment}>
              <label>
                <span>Quantity change</span>
                <input
                  inputMode="numeric"
                  value={deltaText}
                  onChange={(event) => setDeltaText(event.target.value)}
                  placeholder="e.g. 12 or -3"
                  autoFocus
                />
              </label>

              <label>
                <span>Reason</span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={160}
                  rows={3}
                  placeholder="e.g. Supplier delivery received"
                />
                <small>{reason.length}/160</small>
              </label>

              <div className={styles.inventoryPreview}>
                <div>
                  <span>On hand</span>
                  <strong>{adjusting.onHand}</strong>
                </div>
                <div>
                  <span>Reserved</span>
                  <strong>{adjusting.reserved}</strong>
                </div>
                <div>
                  <span>After adjustment</span>
                  <strong>{preview?.next ?? "—"}</strong>
                </div>
              </div>

              {preview && preview.next < preview.reserved ? (
                <div className={styles.error}>
                  Result cannot be below reserved stock ({preview.reserved}).
                </div>
              ) : null}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={busy !== null}
                  onClick={() => setAdjusting(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    busy !== null ||
                    !preview ||
                    !reason.trim() ||
                    preview.next < preview.reserved ||
                    preview.next < 0
                  }
                >
                  {busy === adjusting.variant.id ? "Saving…" : "Apply adjustment"}
                </button>
              </div>
            </form>

            <div className={styles.historyBlock}>
              <h3>Recent adjustment history</h3>

              {historyLoading ? (
                <p className={styles.muted}>Loading history…</p>
              ) : null}

              {!historyLoading && history.length === 0 ? (
                <p className={styles.muted}>No manual adjustments recorded yet.</p>
              ) : null}

              {history.slice(0, 10).map((item) => (
                <div className={styles.historyRow} key={item.id}>
                  <div>
                    <strong>
                      {item.delta > 0 ? "+" : ""}
                      {item.delta}
                    </strong>
                    <span>
                      {item.previousQuantity} → {item.newQuantity}
                    </span>
                  </div>
                  <div className={styles.historyReason}>
                    <strong>{item.reason}</strong>
                    <span>
                      {item.actor.firstName} {item.actor.lastName} ·{" "}
                      {new Date(item.createdAt).toLocaleString("en-MY")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
