"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { StaffCategory, StaffImage, StaffProduct, StaffVariant } from "../domain/staff-catalog";
import styles from "./staff-console.module.css";
import { StaffNav } from "./staff-nav";

type Props = { productId?: string };
type ProductForm = {
  name: string;
  slug: string;
  description: string;
  material: string;
  dimensions: string;
  care: string;
  highlights: string;
  specifications: string;
  colorSwatches: string;
  categoryId: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
};

type VariantDraft = {
  sku: string;
  name: string;
  price: string;
  compareAt: string;
  currency: string;
  isActive: boolean;
  initialQuantity: string;
  options: string;
};

type MatrixDraft = {
  optionOneName: string;
  optionOneValues: string;
  optionTwoName: string;
  optionTwoValues: string;
  skuPrefix: string;
  price: string;
  compareAt: string;
  initialQuantity: string;
};

const blankProduct: ProductForm = { name: "", slug: "", description: "", material: "", dimensions: "", care: "", highlights: "", specifications: "", colorSwatches: "", categoryId: "", status: "DRAFT", isFeatured: false };
const blankVariant: VariantDraft = { sku: "", name: "", price: "", compareAt: "", currency: "MYR", isActive: true, initialQuantity: "0", options: "" };
const blankMatrix: MatrixDraft = { optionOneName: "Color", optionOneValues: "", optionTwoName: "Size", optionTwoValues: "", skuPrefix: "", price: "", compareAt: "", initialQuantity: "0" };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function toCents(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : NaN;
}
function parseOptionValues(input: string) {
  return Object.fromEntries(input.split(",").map((part) => part.trim()).filter(Boolean).map((part) => { const [name, ...rest] = part.split("="); return [name?.trim() ?? "", rest.join("=").trim()]; }).filter(([name, value]) => name && value));
}
function formatOptionValues(values?: Record<string, string> | null) {
  return values ? Object.entries(values).map(([name, value]) => `${name}=${value}`).join(", ") : "";
}

function parseKeyValueLines(input: string) {
  return Object.fromEntries(input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [name, ...rest] = line.split("="); return [name?.trim() ?? "", rest.join("=").trim()]; }).filter(([name, value]) => name && value));
}
function formatKeyValueLines(values?: Record<string, string> | null) {
  return values ? Object.entries(values).map(([name, value]) => `${name}=${value}`).join("\n") : "";
}
function money(cents: number, currency = "MYR") {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency }).format(cents / 100);
}

export function ProductEditor({ productId }: Props) {
  const editing = Boolean(productId);
  const [form, setForm] = useState<ProductForm>(blankProduct);
  const [product, setProduct] = useState<StaffProduct | null>(null);
  const [categories, setCategories] = useState<StaffCategory[]>([]);
  const [variantDraft, setVariantDraft] = useState<VariantDraft>(blankVariant);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [matrixDraft, setMatrixDraft] = useState<MatrixDraft>(blankMatrix);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageVariantId, setImageVariantId] = useState("");
  const [imagePrimary, setImagePrimary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(editing);

  const load = useCallback(async () => {
    setError(null);
    const optionResponse = await fetch("/api/staff/catalog/editor/options", { cache: "no-store" });
    const options = await optionResponse.json().catch(() => null);
    if (!optionResponse.ok) throw new Error(options?.message ?? "Unable to load product editor options.");
    setCategories(options?.categories ?? []);
    if (!productId) return;
    const response = await fetch(`/api/staff/catalog/products/${productId}`, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message ?? "Unable to load product.");
    setProduct(payload);
    setForm({
      name: payload.name ?? "",
      slug: payload.slug ?? "",
      description: payload.description ?? "",
      material: payload.details?.material ?? "",
      dimensions: payload.details?.dimensions ?? "",
      care: payload.details?.care ?? "",
      highlights: (payload.details?.highlights ?? []).join("\n"),
      specifications: formatKeyValueLines(payload.details?.specifications),
      colorSwatches: formatKeyValueLines(payload.colorSwatches),
      categoryId: payload.categoryId ?? payload.category?.id ?? "",
      status: payload.status ?? "DRAFT",
      isFeatured: Boolean(payload.isFeatured),
    });
  }, [productId]);

  useEffect(() => {
    void load().catch((e) => setError(e instanceof Error ? e.message : "Unable to load product editor."));
  }, [load]);

  const variants = product?.variants ?? [];
  const images = product?.images ?? [];
  const canPublish = variants.some((v) => v.isActive);

  async function request(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message ?? "Operation failed.");
    return payload;
  }

  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setSuccess(null);
    try {
      if (!form.name.trim() || !form.slug.trim()) throw new Error("Product name and slug are required.");
      if (form.status === "ACTIVE" && editing && !canPublish) throw new Error("Add at least one active SKU before publishing.");
      const body = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim(), details: { material: form.material.trim(), dimensions: form.dimensions.trim(), care: form.care.trim(), highlights: form.highlights.split(/\r?\n/).map((value) => value.trim()).filter(Boolean), specifications: parseKeyValueLines(form.specifications) }, colorSwatches: parseKeyValueLines(form.colorSwatches), categoryId: form.categoryId || null, status: form.status, isFeatured: form.isFeatured };
      if (editing && productId) {
        await request(`/api/staff/catalog/products/${productId}`, "PUT", body);
        setSuccess("Product details saved.");
        await load();
      } else {
        const created = await request("/api/staff/catalog/products", "POST", body);
        window.location.href = `/staff/catalog/${created.id}`;
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save product."); }
    finally { setBusy(false); }
  }

  function editVariant(variant: StaffVariant) {
    setEditingVariant(variant.id);
    setVariantDraft({
      sku: variant.sku,
      name: variant.name,
      price: (variant.priceCents / 100).toFixed(2),
      compareAt: variant.compareAtCents == null ? "" : (variant.compareAtCents / 100).toFixed(2),
      currency: variant.currency,
      isActive: variant.isActive,
      initialQuantity: "0",
      options: formatOptionValues(variant.optionValues),
    });
  }

  async function saveVariant(e: FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const priceCents = toCents(variantDraft.price);
      const compareAtCents = variantDraft.compareAt.trim() ? toCents(variantDraft.compareAt) : null;
      const initialQuantity = Number(variantDraft.initialQuantity || "0");
      if (!Number.isInteger(priceCents) || priceCents < 0) throw new Error("Enter a valid selling price.");
      if (compareAtCents !== null && (!Number.isInteger(compareAtCents) || compareAtCents < priceCents)) throw new Error("Compare-at price must be at least the selling price.");
      const body = { sku: variantDraft.sku, name: variantDraft.name, priceCents, compareAtCents, currency: variantDraft.currency, isActive: variantDraft.isActive, optionValues: parseOptionValues(variantDraft.options), ...(!editingVariant ? { initialQuantity } : {}) };
      if (editingVariant) await request(`/api/staff/catalog/variants/${editingVariant}/details`, "PATCH", body);
      else await request(`/api/staff/catalog/products/${productId}/variants`, "POST", body);
      setVariantDraft(blankVariant); setEditingVariant(null); setSuccess(editingVariant ? "SKU saved." : "SKU created.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to save SKU."); }
    finally { setBusy(false); }
  }

  async function generateMatrix(e: FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const options = [
        { name: matrixDraft.optionOneName.trim(), values: matrixDraft.optionOneValues.split(",").map((value) => value.trim()).filter(Boolean) },
        ...(matrixDraft.optionTwoName.trim() && matrixDraft.optionTwoValues.trim() ? [{ name: matrixDraft.optionTwoName.trim(), values: matrixDraft.optionTwoValues.split(",").map((value) => value.trim()).filter(Boolean) }] : []),
      ];
      const priceCents = toCents(matrixDraft.price);
      const compareAtCents = matrixDraft.compareAt.trim() ? toCents(matrixDraft.compareAt) : null;
      const initialQuantity = Number(matrixDraft.initialQuantity || "0");
      if (!options[0].name || options[0].values.length === 0) throw new Error("Enter at least one option and its values.");
      if (!matrixDraft.skuPrefix.trim()) throw new Error("SKU prefix is required.");
      if (!Number.isInteger(priceCents) || priceCents < 0) throw new Error("Enter a valid selling price.");
      if (!Number.isInteger(initialQuantity) || initialQuantity < 0) throw new Error("Initial inventory must be a non-negative integer.");
      const result = await request(`/api/staff/catalog/products/${productId}/variant-matrix`, "POST", { options, skuPrefix: matrixDraft.skuPrefix, priceCents, compareAtCents, currency: "MYR", initialQuantity });
      setSuccess(`Variant matrix created: ${result.createdCount ?? 0} created, ${result.skippedCount ?? 0} already existed.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to generate variant matrix."); }
    finally { setBusy(false); }
  }

  async function removeVariant(variant: StaffVariant) {
    if (!window.confirm(`Remove ${variant.sku}? Historical or in-use SKUs will be disabled instead of physically deleted.`)) return;
    setBusy(true); setError(null); setSuccess(null);
    try {
      const result = await request(`/api/staff/catalog/variants/${variant.id}`, "DELETE");
      setSuccess(result?.message ?? (result?.deleted ? "SKU deleted." : "SKU disabled."));
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to remove SKU."); }
    finally { setBusy(false); }
  }

  async function addImage(e: FormEvent) {
    e.preventDefault();
    if (!productId) return;
    if (!imageFile) { setError("Choose a JPG, PNG, or WebP image first."); return; }
    setBusy(true); setError(null); setSuccess(null);
    try {
      const body = new FormData();
      body.set("productId", productId);
      body.set("file", imageFile);
      body.set("altText", imageAlt.trim());
      body.set("variantId", imageVariantId);
      body.set("isPrimary", String(imagePrimary));
      const response = await fetch("/api/staff/media/images", { method: "POST", body });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to upload image.");
      setImageFile(null); setImageAlt(""); setImageVariantId(""); setImagePrimary(false); setSuccess("Product image uploaded.");
      const input = document.getElementById("product-image-upload") as HTMLInputElement | null;
      if (input) input.value = "";
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to upload image."); }
    finally { setBusy(false); }
  }

  async function imageAction(image: StaffImage, action: "primary" | "delete") {
    setBusy(true); setError(null); setSuccess(null);
    try {
      if (action === "primary") await request(`/api/staff/catalog/images/${image.id}`, "PATCH", { isPrimary: true });
      else await request(`/api/staff/catalog/images/${image.id}`, "DELETE");
      setSuccess(action === "primary" ? "Primary image updated." : "Image removed.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update image."); }
    finally { setBusy(false); }
  }

  const previewUrl = useMemo(() => form.slug ? `/products/${form.slug}` : null, [form.slug]);

  return <main className={styles.shell}>
    <StaffNav active="catalog" />
    <header className={styles.header}>
      <div><span className={styles.eyebrow}>PRODUCT EDITOR</span><h1>{editing ? "Edit product" : "Create product"}</h1><p>Manage sellable product data without direct database edits.</p></div>
      <div className={styles.headerActions}><Link className={styles.secondaryLink} href="/staff/catalog">Back to catalog</Link>{editing && previewUrl ? <Link className={styles.primaryLink} href={previewUrl} target="_blank">Preview</Link> : null}</div>
    </header>
    {error ? <div className={styles.error}>{error}</div> : null}{success ? <div className={styles.success}>{success}</div> : null}

    <section className={styles.editorGrid}>
      <form className={styles.panel} onSubmit={saveProduct}>
        <div className={styles.panelHeading}><div><h2>Product details</h2><p>Core storefront content and publishing state.</p></div></div>
        <div className={styles.formGrid}>
          <label className={styles.span2}><span>Name</span><input value={form.name} onChange={(e) => { const name=e.target.value; setForm((f)=>({...f,name,slug:slugTouched?f.slug:slugify(name)})); }} required /></label>
          <label><span>Slug</span><input value={form.slug} onChange={(e)=>{setSlugTouched(true);setForm((f)=>({...f,slug:slugify(e.target.value)}));}} required /></label>
          <label><span>Category</span><select value={form.categoryId} onChange={(e)=>setForm((f)=>({...f,categoryId:e.target.value}))}><option value="">Uncategorised</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label><span>Status</span><select value={form.status} onChange={(e)=>setForm((f)=>({...f,status:e.target.value as ProductForm["status"]}))}><option>DRAFT</option><option disabled={!editing || !canPublish}>ACTIVE</option><option>ARCHIVED</option></select></label>
          <label className={styles.toggleLabel}><input type="checkbox" checked={form.isFeatured} onChange={(e)=>setForm((f)=>({...f,isFeatured:e.target.checked}))}/><span>Featured product</span></label>
          <label className={styles.span2}><span>Description</span><textarea rows={7} maxLength={5000} value={form.description} onChange={(e)=>setForm((f)=>({...f,description:e.target.value}))}/><small>{form.description.length}/5000</small></label>
          <label className={styles.span2}><span>Material</span><textarea rows={3} maxLength={1000} value={form.material} onChange={(e)=>setForm((f)=>({...f,material:e.target.value}))} placeholder="Real material information shown in Product details" /></label>
          <label className={styles.span2}><span>Dimensions / fit</span><textarea rows={3} maxLength={1000} value={form.dimensions} onChange={(e)=>setForm((f)=>({...f,dimensions:e.target.value}))} placeholder="Dimensions, sizing or fit information" /></label>
          <label className={styles.span2}><span>Care</span><textarea rows={3} maxLength={1500} value={form.care} onChange={(e)=>setForm((f)=>({...f,care:e.target.value}))} placeholder="Care or maintenance instructions" /></label>
          <label className={styles.span2}><span>Highlights</span><textarea rows={5} value={form.highlights} onChange={(e)=>setForm((f)=>({...f,highlights:e.target.value}))} placeholder={"One factual highlight per line"}/><small>Only enter facts that are true for this product.</small></label>
          <label className={styles.span2}><span>Specifications</span><textarea rows={5} value={form.specifications} onChange={(e)=>setForm((f)=>({...f,specifications:e.target.value}))} placeholder={"Capacity=750 ml\nWeight=320 g"}/><small>One Label=Value specification per line.</small></label>
          <label className={styles.span2}><span>Color swatches</span><textarea rows={4} value={form.colorSwatches} onChange={(e)=>setForm((f)=>({...f,colorSwatches:e.target.value}))} placeholder={"Black=#1D1D1B\nCream=#F2EBDD"}/><small>Optional. Match real Color option values exactly and provide a 6-digit hex code. Elvane never guesses colors.</small></label>
        </div>
        <div className={styles.panelActions}><button disabled={busy}>{busy ? "Saving…" : editing ? "Save product" : "Create draft"}</button></div>
      </form>

      <aside className={styles.panel}><h2>Publishing readiness</h2><div className={styles.readiness}><div><span>Product</span><strong>{form.name.trim() ? "Ready" : "Needs name"}</strong></div><div><span>SKU</span><strong>{editing ? (canPublish ? "Ready" : "Add active SKU") : "After draft creation"}</strong></div><div><span>Media</span><strong>{editing ? (images.length ? `${images.length} image${images.length === 1 ? "" : "s"}` : "Optional") : "After draft creation"}</strong></div></div><p className={styles.muted}>Draft first, then add SKUs and media. Publishing never bypasses backend validation.</p></aside>
    </section>

    {editing && productId ? <>
      <section className={styles.panelSection}>
        <div className={styles.panelHeading}><div><h2>Variants & SKUs</h2><p>Edit commercial SKU data. Inventory quantity remains controlled by audited stock adjustments after creation.</p></div></div>
        <div className={styles.variantCards}>{variants.map((v)=><article className={styles.variantCard} key={v.id}><div><strong>{v.name}</strong><span>{v.sku}</span>{v.optionValues && Object.keys(v.optionValues).length ? <span>{formatOptionValues(v.optionValues)}</span> : null}</div><div><strong>{money(v.priceCents,v.currency)}</strong><span>{v.inventory?.quantity ?? 0} on hand · {v.inventory?.reserved ?? 0} reserved · {v.isActive ? "ACTIVE" : "DISABLED"}</span></div><div className={styles.actions}><button type="button" onClick={()=>editVariant(v)}>Edit</button><button type="button" onClick={()=>void removeVariant(v)}>Remove</button></div></article>)}</div>
        <form className={styles.inlineForm} onSubmit={generateMatrix}>
          <h3>Generate variant matrix</h3>
          <p className={styles.muted}>Create every sellable combination from structured options. Existing combinations are skipped safely.</p>
          <div className={styles.formGrid}>
            <label><span>Option 1</span><input value={matrixDraft.optionOneName} onChange={(e)=>setMatrixDraft((v)=>({...v,optionOneName:e.target.value}))} placeholder="Color"/></label>
            <label><span>Values</span><input value={matrixDraft.optionOneValues} onChange={(e)=>setMatrixDraft((v)=>({...v,optionOneValues:e.target.value}))} placeholder="Black, White, Purple"/></label>
            <label><span>Option 2 (optional)</span><input value={matrixDraft.optionTwoName} onChange={(e)=>setMatrixDraft((v)=>({...v,optionTwoName:e.target.value}))} placeholder="Size"/></label>
            <label><span>Values</span><input value={matrixDraft.optionTwoValues} onChange={(e)=>setMatrixDraft((v)=>({...v,optionTwoValues:e.target.value}))} placeholder="S, M, L"/></label>
            <label><span>SKU prefix</span><input value={matrixDraft.skuPrefix} onChange={(e)=>setMatrixDraft((v)=>({...v,skuPrefix:e.target.value.toUpperCase()}))} placeholder="TS-TEE"/></label>
            <label><span>Base price (RM)</span><input inputMode="decimal" value={matrixDraft.price} onChange={(e)=>setMatrixDraft((v)=>({...v,price:e.target.value}))} required/></label>
            <label><span>Compare-at (RM)</span><input inputMode="decimal" value={matrixDraft.compareAt} onChange={(e)=>setMatrixDraft((v)=>({...v,compareAt:e.target.value}))}/></label>
            <label><span>Initial inventory per SKU</span><input inputMode="numeric" value={matrixDraft.initialQuantity} onChange={(e)=>setMatrixDraft((v)=>({...v,initialQuantity:e.target.value}))}/></label>
          </div>
          <div className={styles.panelActions}><button disabled={busy}>{busy ? "Generating…" : "Generate combinations"}</button></div>
        </form>
        <form className={styles.inlineForm} onSubmit={saveVariant}>
          <h3>{editingVariant ? "Edit SKU" : "Add SKU"}</h3>
          <div className={styles.formGrid}>
            <label><span>SKU</span><input value={variantDraft.sku} onChange={(e)=>setVariantDraft((v)=>({...v,sku:e.target.value.toUpperCase()}))} required/></label>
            <label><span>Variant name</span><input value={variantDraft.name} onChange={(e)=>setVariantDraft((v)=>({...v,name:e.target.value}))} required/></label>
            <label className={styles.span2}><span>Structured options</span><input value={variantDraft.options} onChange={(e)=>setVariantDraft((v)=>({...v,options:e.target.value}))} placeholder="Color=Black, Size=M"/><small>Use Name=Value pairs separated by commas.</small></label>
            <label><span>Price (RM)</span><input inputMode="decimal" value={variantDraft.price} onChange={(e)=>setVariantDraft((v)=>({...v,price:e.target.value}))} required/></label>
            <label><span>Compare-at (RM)</span><input inputMode="decimal" value={variantDraft.compareAt} onChange={(e)=>setVariantDraft((v)=>({...v,compareAt:e.target.value}))}/></label>
            {!editingVariant ? <label><span>Initial inventory</span><input inputMode="numeric" value={variantDraft.initialQuantity} onChange={(e)=>setVariantDraft((v)=>({...v,initialQuantity:e.target.value}))}/></label> : null}
            <label className={styles.toggleLabel}><input type="checkbox" checked={variantDraft.isActive} onChange={(e)=>setVariantDraft((v)=>({...v,isActive:e.target.checked}))}/><span>SKU active</span></label>
          </div>
          <div className={styles.panelActions}>{editingVariant ? <button type="button" className={styles.secondaryButton} onClick={()=>{setEditingVariant(null);setVariantDraft(blankVariant);}}>Cancel edit</button> : null}<button disabled={busy}>{editingVariant ? "Save SKU" : "Add SKU"}</button></div>
        </form>
      </section>

      <section className={styles.panelSection}>
        <div className={styles.panelHeading}><div><h2>Product media</h2><p>Upload first-party JPG, PNG, or WebP images directly from your device. Files are validated and stored outside Git.</p></div></div>
        <div className={styles.mediaGrid}>{images.map((image)=><article className={styles.mediaCard} key={image.id}><div className={styles.imageFrame}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={image.url} alt={image.altText ?? form.name}/></div><div><strong>{image.isPrimary ? "PRIMARY" : "IMAGE"}</strong><span>{image.variantId ? variants.find((v)=>v.id===image.variantId)?.sku ?? "Variant image" : "Shared product image"}</span></div><div className={styles.actions}>{!image.isPrimary ? <button type="button" onClick={()=>void imageAction(image,"primary")}>Make primary</button> : null}<button type="button" onClick={()=>void imageAction(image,"delete")}>Remove</button></div></article>)}</div>
        <form className={styles.inlineForm} onSubmit={addImage}>
          <h3>Upload image</h3><div className={styles.formGrid}><label className={styles.span2}><span>Image file</span><input id="product-image-upload" className={styles.uploadInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e)=>setImageFile(e.target.files?.[0] ?? null)} required/><small>{imageFile ? `${imageFile.name} · ${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : "JPG, PNG or WebP · maximum 5 MB"}</small></label><label><span>Alt text</span><input value={imageAlt} onChange={(e)=>setImageAlt(e.target.value)} placeholder={form.name || "Describe the image"}/></label><label><span>Variant assignment</span><select value={imageVariantId} onChange={(e)=>setImageVariantId(e.target.value)}><option value="">Shared product image</option>{variants.map((v)=><option key={v.id} value={v.id}>{v.sku} · {v.name}</option>)}</select></label><label className={styles.toggleLabel}><input type="checkbox" checked={imagePrimary} onChange={(e)=>setImagePrimary(e.target.checked)}/><span>Set as primary</span></label><p className={styles.uploadHint}>Uploaded files are stored by the API media adapter. Product records keep only the resulting media URL, so storage can be replaced later without changing catalog data.</p></div><div className={styles.panelActions}><button disabled={busy || !imageFile}>{busy ? "Uploading…" : "Upload image"}</button></div>
        </form>
      </section>
    </> : null}
  </main>;
}
