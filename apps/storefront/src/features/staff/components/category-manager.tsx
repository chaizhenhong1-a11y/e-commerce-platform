"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
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
const blank: Draft = { name: "", slug: "", sortOrder: "0", isActive: true };
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function CategoryManager() {
  const [items, setItems] = useState<Category[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/staff/categories", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message ?? "Unable to load categories.");
    setItems(payload ?? []);
  }, []);

  useEffect(() => { void load().catch((e) => setError(e instanceof Error ? e.message : "Unable to load categories.")); }, [load]);

  async function save(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(null); setSuccess(null);
    try {
      const body = { name: draft.name.trim(), slug: draft.slug.trim(), sortOrder: Number.parseInt(draft.sortOrder || "0", 10) || 0, isActive: draft.isActive };
      const response = await fetch(editingId ? `/api/staff/categories/${editingId}` : "/api/staff/categories", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save category.");
      setSuccess(editingId ? "Category updated." : "Category created.");
      setEditingId(null); setDraft(blank); setSlugTouched(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save category."); }
    finally { setBusy(false); }
  }

  function edit(item: Category) {
    setEditingId(item.id); setSlugTouched(true);
    setDraft({ name: item.name, slug: item.slug, sortOrder: String(item.sortOrder), isActive: item.isActive });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(item: Category) {
    if (!window.confirm(`Delete category “${item.name}”? Used categories cannot be deleted.`)) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const response = await fetch(`/api/staff/categories/${item.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to delete category.");
      setSuccess("Category deleted."); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete category."); }
    finally { setBusy(false); }
  }

  return <main className={styles.shell}>
    <StaffNav active="categories" />
    <header className={styles.header}><div><span className={styles.eyebrow}>CATALOG STRUCTURE</span><h1>Categories</h1><p>Create, order, deactivate, and safely retire storefront categories.</p></div></header>
    {error ? <div className={styles.error}>{error}</div> : null}{success ? <div className={styles.success}>{success}</div> : null}
    <section className={styles.editorGrid}>
      <form className={styles.panel} onSubmit={save}>
        <div className={styles.panelHeading}><div><h2>{editingId ? "Edit category" : "Create category"}</h2><p>Inactive categories stay in history but disappear from customer category navigation.</p></div></div>
        <div className={styles.formGrid}>
          <label><span>Name</span><input value={draft.name} onChange={(e) => { const name=e.target.value; setDraft((d)=>({...d,name,slug:slugTouched?d.slug:slugify(name)})); }} required /></label>
          <label><span>Slug</span><input value={draft.slug} onChange={(e)=>{setSlugTouched(true);setDraft((d)=>({...d,slug:slugify(e.target.value)}));}} required /></label>
          <label><span>Sort order</span><input inputMode="numeric" value={draft.sortOrder} onChange={(e)=>setDraft((d)=>({...d,sortOrder:e.target.value}))}/></label>
          <label className={styles.toggleLabel}><input type="checkbox" checked={draft.isActive} onChange={(e)=>setDraft((d)=>({...d,isActive:e.target.checked}))}/><span>Active</span></label>
        </div>
        <div className={styles.panelActions}>{editingId ? <button type="button" className={styles.secondaryButton} onClick={()=>{setEditingId(null);setDraft(blank);setSlugTouched(false);}}>Cancel</button> : null}<button disabled={busy}>{busy ? "Saving…" : editingId ? "Save category" : "Create category"}</button></div>
      </form>
      <aside className={styles.panel}><h2>Deletion safety</h2><p className={styles.muted}>A category assigned to any product cannot be physically deleted. Deactivate it instead so product history and catalog relationships remain intact.</p></aside>
    </section>
    <section className={styles.panelSection}>
      <div className={styles.panelHeading}><div><h2>All categories</h2><p>{items.length} configured categories</p></div></div>
      <div className={styles.categoryRows}>{items.map((item)=><article key={item.id} className={styles.categoryRow}><div><strong>{item.name}</strong><span>/{item.slug} · sort {item.sortOrder}</span></div><div><strong>{item.isActive ? "ACTIVE" : "INACTIVE"}</strong><span>{item._count.products} product{item._count.products===1?"":"s"}</span></div><div className={styles.actions}><button type="button" onClick={()=>edit(item)}>Edit</button><button type="button" disabled={busy} onClick={()=>void remove(item)}>Delete</button></div></article>)}</div>
    </section>
  </main>;
}
