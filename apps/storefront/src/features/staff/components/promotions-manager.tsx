"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { StaffNav } from "./staff-nav";
import styles from "./staff-console.module.css";

type Coupon = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minSubtotalCents: number;
  maxDiscountCents: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  isActive: boolean;
  productIds: string[];
  categoryIds: string[];
  _count: { redemptions: number };
};

type ProductOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

type Draft = {
  code: string;
  name: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: string;
  minSubtotal: string;
  maxDiscount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perUserLimit: string;
  isActive: boolean;
  productIds: string[];
  categoryIds: string[];
};

const blank: Draft = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  value: "10",
  minSubtotal: "0",
  maxDiscount: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perUserLimit: "",
  isActive: true,
  productIds: [],
  categoryIds: [],
};

const cents = (value: string) => Math.round((Number(value || "0") || 0) * 100);
const optionalInt = (value: string) => value.trim() ? Number.parseInt(value, 10) : null;
const dateInput = (value: string | null) => value ? value.slice(0, 16) : "";

export function PromotionsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lifecycle, setLifecycle] = useState<"ACTIVE" | "INACTIVE" | "ALL">("ACTIVE");

  const load = useCallback(async () => {
    const [couponResponse, productResponse, categoryResponse] = await Promise.all([
      fetch("/api/staff/promotions", { cache: "no-store" }),
      fetch("/api/staff/catalog", { cache: "no-store" }),
      fetch("/api/staff/categories", { cache: "no-store" }),
    ]);
    const couponBody = await couponResponse.json().catch(() => null);
    if (!couponResponse.ok) throw new Error(couponBody?.message ?? "Unable to load promotions.");
    const productBody = await productResponse.json().catch(() => []);
    const categoryBody = await categoryResponse.json().catch(() => []);
    setCoupons(Array.isArray(couponBody) ? couponBody : []);
    setProducts(Array.isArray(productBody) ? productBody.map((item: ProductOption) => ({ id: item.id, name: item.name })) : []);
    setCategories(Array.isArray(categoryBody) ? categoryBody.map((item: CategoryOption) => ({ id: item.id, name: item.name })) : []);
  }, []);

  useEffect(() => {
    void load().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load promotions."));
  }, [load]);

  const now = Date.now();
  const couponSummary = useMemo(() => ({
    total: coupons.length,
    active: coupons.filter((item) => item.isActive).length,
    inactive: coupons.filter((item) => !item.isActive).length,
    scheduled: coupons.filter((item) => item.isActive && item.startsAt && new Date(item.startsAt).getTime() > now).length,
    redemptions: coupons.reduce((sum, item) => sum + item._count.redemptions, 0),
  }), [coupons, now]);

  const visibleCoupons = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return coupons.filter((item) => {
      if (lifecycle === "ACTIVE" && !item.isActive) return false;
      if (lifecycle === "INACTIVE" && item.isActive) return false;
      return !needle || item.code.toLowerCase().includes(needle) || item.name.toLowerCase().includes(needle);
    });
  }, [coupons, lifecycle, query]);

  const couponState = (item: Coupon) => {
    if (!item.isActive) return "Inactive";
    const current = Date.now();
    if (item.startsAt && new Date(item.startsAt).getTime() > current) return "Scheduled";
    if (item.endsAt && new Date(item.endsAt).getTime() < current) return "Expired";
    return "Active";
  };

  const scopeLabel = useMemo(() => {
    if (draft.productIds.length === 0 && draft.categoryIds.length === 0) return "All products";
    const parts: string[] = [];
    if (draft.productIds.length) parts.push(`${draft.productIds.length} product${draft.productIds.length === 1 ? "" : "s"}`);
    if (draft.categoryIds.length) parts.push(`${draft.categoryIds.length} categor${draft.categoryIds.length === 1 ? "y" : "ies"}`);
    return parts.join(" + ");
  }, [draft.productIds, draft.categoryIds]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(null); setSuccess(null);
    try {
      const payload = {
        code: draft.code.trim().toUpperCase(),
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        discountType: draft.discountType,
        value: draft.discountType === "PERCENTAGE" ? Number.parseInt(draft.value, 10) : cents(draft.value),
        minSubtotalCents: cents(draft.minSubtotal),
        maxDiscountCents: draft.maxDiscount.trim() ? cents(draft.maxDiscount) : null,
        startsAt: draft.startsAt ? new Date(draft.startsAt).toISOString() : null,
        endsAt: draft.endsAt ? new Date(draft.endsAt).toISOString() : null,
        usageLimit: optionalInt(draft.usageLimit),
        perUserLimit: optionalInt(draft.perUserLimit),
        isActive: draft.isActive,
        productIds: draft.productIds,
        categoryIds: draft.categoryIds,
      };
      const response = await fetch(editingId ? `/api/staff/promotions/${editingId}` : "/api/staff/promotions", {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "Unable to save coupon.");
      setSuccess(editingId ? "Coupon updated." : "Coupon created.");
      setDraft(blank); setEditingId(null); await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save coupon.");
    } finally { setBusy(false); }
  }

  function edit(item: Coupon) {
    setEditingId(item.id);
    setDraft({
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      discountType: item.discountType,
      value: item.discountType === "PERCENTAGE" ? String(item.value) : (item.value / 100).toFixed(2),
      minSubtotal: (item.minSubtotalCents / 100).toFixed(2),
      maxDiscount: item.maxDiscountCents == null ? "" : (item.maxDiscountCents / 100).toFixed(2),
      startsAt: dateInput(item.startsAt),
      endsAt: dateInput(item.endsAt),
      usageLimit: item.usageLimit == null ? "" : String(item.usageLimit),
      perUserLimit: item.perUserLimit == null ? "" : String(item.perUserLimit),
      isActive: item.isActive,
      productIds: item.productIds,
      categoryIds: item.categoryIds,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deactivate(id: string) {
    if (!window.confirm("Deactivate this coupon? Existing order snapshots are preserved.")) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const response = await fetch(`/api/staff/promotions/${id}/deactivate`, { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "Unable to deactivate coupon.");
      setSuccess("Coupon deactivated."); await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to deactivate coupon.");
    } finally { setBusy(false); }
  }

  const toggle = (field: "productIds" | "categoryIds", id: string) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((value) => value !== id)
        : [...current[field], id],
    }));
  };

  return <main className={styles.shell}>
    <StaffNav active="promotions" />
    <div className={`${styles.staffWorkspace} ${styles.promotionWorkspace}`}>
    <header className={styles.header}><div><span className={styles.eyebrow}>PROMOTIONS</span><h1>Coupons</h1><p>Create controlled coupon campaigns with schedules, usage limits, and catalog scopes.</p></div><Link className={styles.promotionSwitch} href="/staff/promotions/automatic">Automatic discounts →</Link></header>
    <section className={styles.promotionSummary} aria-label="Coupon summary">
      <div><span>Total coupons</span><strong>{couponSummary.total}</strong></div>
      <div><span>Active</span><strong>{couponSummary.active}</strong></div>
      <div><span>Inactive</span><strong>{couponSummary.inactive}</strong></div>
      <div><span>Scheduled</span><strong>{couponSummary.scheduled}</strong></div>
      <div><span>Redemptions</span><strong>{couponSummary.redemptions}</strong></div>
    </section>
    {error ? <div className={styles.error}>{error}</div> : null}
    {success ? <div className={styles.success}>{success}</div> : null}

    <section className={styles.editorGrid}>
      <form className={styles.panel} onSubmit={save}>
        <div className={styles.panelHeading}><div><h2>{editingId ? "Edit coupon" : "Create coupon"}</h2><p>All totals are recalculated by the API at checkout.</p></div></div>
        <div className={styles.formGrid}>
          <label><span>Code</span><input required value={draft.code} onChange={(e)=>setDraft((d)=>({...d,code:e.target.value.toUpperCase().replace(/\s+/g,"")}))} placeholder="WELCOME10" /></label>
          <label><span>Name</span><input required value={draft.name} onChange={(e)=>setDraft((d)=>({...d,name:e.target.value}))} placeholder="Welcome discount" /></label>
          <label><span>Discount type</span><select value={draft.discountType} onChange={(e)=>setDraft((d)=>({...d,discountType:e.target.value as Draft["discountType"]}))}><option value="PERCENTAGE">Percentage</option><option value="FIXED_AMOUNT">Fixed amount</option></select></label>
          <label><span>{draft.discountType === "PERCENTAGE" ? "Percentage (%)" : "Amount (RM)"}</span><input required inputMode="decimal" value={draft.value} onChange={(e)=>setDraft((d)=>({...d,value:e.target.value}))} /></label>
          <label><span>Minimum subtotal (RM)</span><input inputMode="decimal" value={draft.minSubtotal} onChange={(e)=>setDraft((d)=>({...d,minSubtotal:e.target.value}))} /></label>
          <label><span>Maximum discount (RM)</span><input inputMode="decimal" value={draft.maxDiscount} onChange={(e)=>setDraft((d)=>({...d,maxDiscount:e.target.value}))} placeholder="Optional" /></label>
          <label><span>Starts at</span><input type="datetime-local" value={draft.startsAt} onChange={(e)=>setDraft((d)=>({...d,startsAt:e.target.value}))} /></label>
          <label><span>Ends at</span><input type="datetime-local" value={draft.endsAt} onChange={(e)=>setDraft((d)=>({...d,endsAt:e.target.value}))} /></label>
          <label><span>Total usage limit</span><input inputMode="numeric" value={draft.usageLimit} onChange={(e)=>setDraft((d)=>({...d,usageLimit:e.target.value}))} placeholder="Unlimited" /></label>
          <label><span>Per-account limit</span><input inputMode="numeric" value={draft.perUserLimit} onChange={(e)=>setDraft((d)=>({...d,perUserLimit:e.target.value}))} placeholder="Unlimited" /></label>
          <label className={styles.toggleLabel}><input type="checkbox" checked={draft.isActive} onChange={(e)=>setDraft((d)=>({...d,isActive:e.target.checked}))}/><span>Active</span></label>
          <label className={styles.fullField}><span>Description</span><textarea rows={3} maxLength={500} value={draft.description} onChange={(e)=>setDraft((d)=>({...d,description:e.target.value}))} /></label>
        </div>

        <div className={styles.scopeBlock}>
          <div><strong>Eligible catalog scope</strong><span>{scopeLabel}. Leave both groups empty to apply to all products.</span></div>
          <div className={styles.scopeColumns}>
            <div><strong>Categories</strong>{categories.map((item)=><label className={styles.scopeCheck} key={item.id}><input type="checkbox" checked={draft.categoryIds.includes(item.id)} onChange={()=>toggle("categoryIds",item.id)}/><span>{item.name}</span></label>)}</div>
            <div><strong>Products</strong>{products.map((item)=><label className={styles.scopeCheck} key={item.id}><input type="checkbox" checked={draft.productIds.includes(item.id)} onChange={()=>toggle("productIds",item.id)}/><span>{item.name}</span></label>)}</div>
          </div>
        </div>

        <div className={styles.panelActions}>{editingId ? <button type="button" className={styles.secondaryButton} onClick={()=>{setEditingId(null);setDraft(blank);}}>Cancel</button> : null}<button disabled={busy}>{busy ? "Saving…" : editingId ? "Save coupon" : "Create coupon"}</button></div>
      </form>

      <aside className={styles.panel}><h2>Commercial safety</h2><p className={styles.muted}>Coupon discounts are snapshotted onto the order. Changing or deactivating a coupon never rewrites historical orders. Cancelled and expired orders do not permanently consume usage limits.</p></aside>
    </section>

    <section className={`${styles.panelSection} ${styles.promotionDirectory}`}>
      <div className={styles.promotionDirectoryHeader}><div><span className={styles.eyebrow}>CAMPAIGN DIRECTORY</span><h2>Configured coupons</h2><p>{visibleCoupons.length} shown from {coupons.length} coupons</p></div><button className={styles.secondaryButton} type="button" onClick={()=>void load()}>Refresh</button></div>
      <div className={styles.promotionLifecycleTabs}>
        {([["ACTIVE",`Active (${couponSummary.active})`],["INACTIVE",`Inactive (${couponSummary.inactive})`],["ALL",`All (${couponSummary.total})`]] as const).map(([value,label])=><button type="button" key={value} className={lifecycle===value?styles.promotionLifecycleActive:""} onClick={()=>setLifecycle(value)}>{label}</button>)}
      </div>
      <label className={styles.promotionSearch}><span>Search coupons</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Coupon code or campaign name" /></label>
      <div className={styles.promotionCards}>
        {visibleCoupons.map((item)=>{
          const state=couponState(item);
          const scope=item.productIds.length||item.categoryIds.length?`${item.productIds.length} products · ${item.categoryIds.length} categories`:"Entire catalog";
          return <article className={styles.promotionCard} key={item.id}>
            <div className={styles.promotionCardTop}><div><span className={styles.promotionCode}>{item.code}</span><h3>{item.name}</h3><p>{item.description||"No campaign description."}</p></div><span className={`${styles.promotionState} ${state==="Active"?styles.promotionStateActive:""}`}>{state}</span></div>
            <div className={styles.promotionFacts}>
              <div><span>Discount</span><strong>{item.discountType==="PERCENTAGE"?`${item.value}%`:`RM ${(item.value/100).toFixed(2)}`}</strong></div>
              <div><span>Redemptions</span><strong>{item._count.redemptions}{item.usageLimit==null?"":` / ${item.usageLimit}`}</strong></div>
              <div><span>Minimum</span><strong>RM {(item.minSubtotalCents/100).toFixed(2)}</strong></div>
              <div><span>Scope</span><strong>{scope}</strong></div>
            </div>
            <div className={styles.promotionCardFooter}><span>{item.startsAt?`Starts ${new Date(item.startsAt).toLocaleString("en-MY")}`:"Starts immediately"} · {item.endsAt?`Ends ${new Date(item.endsAt).toLocaleString("en-MY")}`:"No end date"}</span><div className={styles.categoryActions}><button type="button" onClick={()=>edit(item)}>Edit</button>{item.isActive?<button type="button" disabled={busy} onClick={()=>void deactivate(item.id)}>Deactivate</button>:null}</div></div>
          </article>;
        })}
      </div>
      {!visibleCoupons.length ? <div className={styles.empty}>No coupons match this view.</div> : null}
    </section>
    </div>
  </main>;
}
