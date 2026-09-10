"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./staff-console.module.css";
import { StaffNav } from "./staff-nav";

type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
};

type Draft = { name: string; slug: string; sortOrder: string; isActive: boolean };
type Lifecycle = "ALL" | "ACTIVE" | "INACTIVE";

const blank: Draft = { name: "", slug: "", sortOrder: "0", isActive: true };
const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function CategoryManager() {
  const [items, setItems] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState<Lifecycle>("ACTIVE");
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/staff/categories", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message ?? "Unable to load categories.");
    setItems(Array.isArray(payload) ? payload : []);
  }, []);

  useEffect(() => {
    void load().catch((cause: unknown) =>
      setError(cause instanceof Error ? cause.message : "Unable to load categories."),
    );
  }, [load]);

  const summary = useMemo(() => ({
    total: items.length,
    active: items.filter((item) => item.isActive).length,
    inactive: items.filter((item) => !item.isActive).length,
    assignedProducts: items.reduce((sum, item) => sum + item._count.products, 0),
    empty: items.filter((item) => item._count.products === 0).length,
  }), [items]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        if (lifecycle === "ACTIVE" && !item.isActive) return false;
        if (lifecycle === "INACTIVE" && item.isActive) return false;
        if (!needle) return true;
        return item.name.toLowerCase().includes(needle) || item.slug.toLowerCase().includes(needle);
      })
      .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  }, [items, lifecycle, query]);

  function resetEditor() {
    setEditingId(null);
    setDraft(blank);
    setSlugTouched(false);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const body = {
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        sortOrder: Number.parseInt(draft.sortOrder || "0", 10) || 0,
        isActive: draft.isActive,
      };
      const response = await fetch(
        editingId ? `/api/staff/categories/${editingId}` : "/api/staff/categories",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save category.");
      setSuccess(editingId ? "Category updated." : "Category created.");
      resetEditor();
      await load();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to save category.");
    } finally {
      setBusy(false);
    }
  }

  function edit(item: Category) {
    setEditingId(item.id);
    setSlugTouched(true);
    setDraft({
      name: item.name,
      slug: item.slug,
      sortOrder: String(item.sortOrder),
      isActive: item.isActive,
    });
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function setActive(item: Category, isActive: boolean) {
    setBusyId(item.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/staff/categories/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          slug: item.slug,
          sortOrder: item.sortOrder,
          isActive,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to update category.");
      setSuccess(`${item.name} ${isActive ? "activated" : "deactivated"}.`);
      await load();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to update category.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: Category) {
    if (item._count.products > 0) {
      setError(`“${item.name}” still contains ${item._count.products} product${item._count.products === 1 ? "" : "s"}. Deactivate it instead.`);
      return;
    }
    if (!window.confirm(`Permanently delete empty category “${item.name}”?`)) return;
    setBusyId(item.id);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/staff/categories/${item.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to delete category.");
      setSuccess("Category deleted.");
      if (editingId === item.id) resetEditor();
      await load();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to delete category.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className={styles.shell}>
      <StaffNav active="categories" />
      <div className={`${styles.staffWorkspace} ${styles.categoryWorkspace}`}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>CATALOG STRUCTURE</span>
            <h1>Categories</h1>
            <p>Organise storefront navigation, product grouping, visibility, and category order.</p>
          </div>
        </header>

        <section className={styles.categorySummary} aria-label="Category summary">
          <div><span>Total categories</span><strong>{summary.total}</strong></div>
          <div><span>Active</span><strong>{summary.active}</strong></div>
          <div><span>Inactive</span><strong>{summary.inactive}</strong></div>
          <div><span>Product assignments</span><strong>{summary.assignedProducts}</strong></div>
          <div><span>Empty categories</span><strong>{summary.empty}</strong></div>
        </section>

        {error ? <div className={styles.error}>{error}</div> : null}
        {success ? <div className={styles.success}>{success}</div> : null}

        <section className={styles.categoryTopGrid}>
          <form className={`${styles.panel} ${styles.categoryEditor}`} onSubmit={save}>
            <div className={styles.panelHeading}>
              <div>
                <span className={styles.eyebrow}>{editingId ? "EDIT CATEGORY" : "NEW CATEGORY"}</span>
                <h2>{editingId ? "Update category" : "Create category"}</h2>
                <p>Name and slug control how customers discover this group. Sort order controls storefront priority.</p>
              </div>
            </div>

            <div className={styles.formGrid}>
              <label>
                <span>Name</span>
                <input
                  value={draft.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setDraft((current) => ({
                      ...current,
                      name,
                      slug: slugTouched ? current.slug : slugify(name),
                    }));
                  }}
                  placeholder="e.g. Accessories"
                  maxLength={120}
                  required
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setDraft((current) => ({ ...current, slug: slugify(e.target.value) }));
                  }}
                  placeholder="accessories"
                  required
                />
              </label>
              <label>
                <span>Sort order</span>
                <input
                  inputMode="numeric"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft((current) => ({ ...current, sortOrder: e.target.value }))}
                />
                <small>Lower numbers appear first.</small>
              </label>
              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft((current) => ({ ...current, isActive: e.target.checked }))}
                />
                <span>Visible to customers</span>
              </label>
            </div>

            <div className={styles.panelActions}>
              {editingId ? (
                <button type="button" className={styles.secondaryButton} onClick={resetEditor}>
                  Cancel
                </button>
              ) : null}
              <button disabled={busy}>
                {busy ? "Saving…" : editingId ? "Save changes" : "Create category"}
              </button>
            </div>
          </form>

          <aside className={`${styles.panel} ${styles.categorySafety}`}>
            <span className={styles.eyebrow}>SAFE RETIREMENT</span>
            <h2>Deactivate before deleting</h2>
            <p>
              Categories with products stay protected from permanent deletion. Deactivate them to remove them
              from customer navigation while keeping product and promotion relationships intact.
            </p>
            <div className={styles.categorySafetyFacts}>
              <div><strong>{summary.inactive}</strong><span>currently inactive</span></div>
              <div><strong>{summary.empty}</strong><span>safe-to-delete empty</span></div>
            </div>
          </aside>
        </section>

        <section className={`${styles.panelSection} ${styles.categoryDirectory}`}>
          <div className={styles.categoryDirectoryHeader}>
            <div>
              <span className={styles.eyebrow}>CATEGORY DIRECTORY</span>
              <h2>Manage categories</h2>
              <p>{visible.length} shown from {items.length} configured categories</p>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={() => void load()}>
              Refresh
            </button>
          </div>

          <div className={styles.categoryLifecycleTabs}>
            {([
              ["ACTIVE", `Active (${summary.active})`],
              ["INACTIVE", `Inactive (${summary.inactive})`],
              ["ALL", `All (${summary.total})`],
            ] as Array<[Lifecycle, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={lifecycle === value ? styles.categoryLifecycleActive : ""}
                onClick={() => setLifecycle(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.categorySearch}>
            <label>
              <span>Search categories</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or slug"
              />
            </label>
          </div>

          <div className={styles.categoryTableHeader} aria-hidden="true">
            <span>Category</span>
            <span>Products</span>
            <span>Order</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div className={styles.categoryDirectoryRows}>
            {visible.map((item) => (
              <article key={item.id} className={styles.categoryDirectoryRow}>
                <div className={styles.categoryIdentity}>
                  <strong>{item.name}</strong>
                  <span>/{item.slug}</span>
                </div>
                <div className={styles.categoryProductCount}>
                  <strong>{item._count.products}</strong>
                  <span>product{item._count.products === 1 ? "" : "s"}</span>
                </div>
                <div className={styles.categorySort}>
                  <strong>{item.sortOrder}</strong>
                  <span>priority</span>
                </div>
                <div>
                  <span className={`${styles.categoryStatus} ${item.isActive ? styles.categoryStatusActive : styles.categoryStatusInactive}`}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={styles.categoryActions}>
                  <button type="button" onClick={() => edit(item)}>Edit</button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void setActive(item, !item.isActive)}
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className={styles.categoryDelete}
                    disabled={busyId === item.id || item._count.products > 0}
                    title={item._count.products > 0 ? "Move or remove products before deleting this category." : "Delete empty category"}
                    onClick={() => void remove(item)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className={styles.empty}>
              <strong>No categories found.</strong>
              <span>Try another lifecycle view or search term.</span>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
