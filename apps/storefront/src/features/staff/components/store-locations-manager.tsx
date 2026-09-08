"use client";

import { useCallback, useEffect, useState } from "react";
import styles from "./store-locations-manager.module.css";

type Location = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
  countryCode: string;
  phone: string;
  businessHours: string;
  description: string;
  coverUrl: string;
  galleryUrls: string[];
  isPrimary: boolean;
  isActive: boolean;
  sortOrder: number;
};

type Draft = Omit<Location, "id">;

const empty = (sortOrder = 0): Draft => ({
  name: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postcode: "",
  countryCode: "MY",
  phone: "",
  businessHours: "",
  description: "",
  coverUrl: "",
  galleryUrls: [],
  isPrimary: false,
  isActive: true,
  sortOrder,
});

export function StoreLocationsManager() {
  const [items, setItems] = useState<Location[]>([]);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(empty());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/staff/settings/locations", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.message ?? "Unable to load store locations.");
    setItems(Array.isArray(payload) ? payload : []);
  }, []);

  useEffect(() => {
    void load().catch((e: unknown) => setError(e instanceof Error ? e.message : "Unable to load store locations."));
  }, [load]);

  const edit = (item: Location) => {
    const { id: _, ...value } = item;
    void _;
    setDraft(value);
    setEditing(item.id);
  };

  const add = () => {
    setDraft({ ...empty(items.length), isPrimary: items.length === 0 });
    setEditing("new");
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const photos = [draft.coverUrl, ...draft.galleryUrls].filter((value, index, all) => Boolean(value) && all.indexOf(value) === index);
  const applyPhotos = (urls: string[]) => setDraft((current) => ({ ...current, coverUrl: urls[0] ?? "", galleryUrls: urls.slice(1, 8) }));

  async function upload(files: File[]) {
    setBusy(true);
    setError(null);
    try {
      const next = [...photos];
      for (const file of files.slice(0, 8 - next.length)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/staff/settings/media", { method: "POST", body });
        const payload = await response.json();
        if (!response.ok || !payload?.url) throw new Error(payload?.message ?? "Unable to upload branch photo.");
        if (!next.includes(payload.url)) next.push(payload.url);
      }
      applyPhotos(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload branch photo.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!draft.name.trim()) {
      setError("Branch name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = editing === "new" ? "/api/staff/settings/locations" : `/api/staff/settings/locations/${editing}`;
      const response = await fetch(url, {
        method: editing === "new" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save branch.");
      await load();
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save branch.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this branch?")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/staff/settings/locations/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to delete branch.");
      await load();
      setEditing(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete branch.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <div>
          <h3>Store locations</h3>
          <p>Each branch keeps its own introduction, address, hours, phone and photos.</p>
        </div>
        <button type="button" onClick={add}>+ Add branch</button>
      </div>

      <div className={styles.cards}>
        {items.map((item) => (
          <article key={item.id} className={styles.card}>
            {item.coverUrl ? <img src={item.coverUrl} alt="" /> : <div className={styles.placeholder}>STORE</div>}
            <div>
              <div className={styles.title}>{item.name} {item.isPrimary ? <span>Primary</span> : null}</div>
              <p>{[item.addressLine1, item.postcode, item.city, item.state].filter(Boolean).join(", ") || "Address not set"}</p>
              <small>{item.isActive ? "Active" : "Hidden"} · {1 + item.galleryUrls.length} photo{item.galleryUrls.length ? "s" : ""}</small>
            </div>
            <button type="button" onClick={() => edit(item)}>Edit</button>
          </article>
        ))}
      </div>

      {editing ? (
        <div className={styles.editor}>
          <h4>{editing === "new" ? "Add branch" : "Edit branch"}</h4>
          <div className={styles.grid}>
            {([['Branch name','name'],['Address line 1','addressLine1'],['Address line 2','addressLine2'],['City','city'],['State','state'],['Postcode','postcode'],['Country code','countryCode'],['Branch phone','phone'],['Business hours','businessHours']] as const).map(([label, key]) => (
              <label key={key}>
                <span>{label}</span>
                <input value={String(draft[key])} maxLength={key === 'countryCode' ? 2 : undefined} onChange={(e) => set(key, key === 'countryCode' ? e.target.value.toUpperCase() : e.target.value)} />
              </label>
            ))}
          </div>
          <label>
            <span>Branch introduction</span>
            <textarea rows={5} maxLength={2000} value={draft.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe this branch, its atmosphere, services or what customers should know." />
          </label>
          <div className={styles.checks}>
            <label><input type="checkbox" checked={draft.isPrimary} onChange={(e) => set("isPrimary", e.target.checked)} /> Primary branch</label>
            <label><input type="checkbox" checked={draft.isActive} onChange={(e) => set("isActive", e.target.checked)} /> Visible to customers</label>
          </div>
          <div className={styles.photoHead}>
            <strong>Branch photos</strong>
            {photos.length < 8 ? (
              <label className={styles.addPhoto}>{busy ? "Working…" : "+ Add photos"}<input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { void upload(Array.from(e.target.files ?? [])); e.currentTarget.value = ""; }} /></label>
            ) : null}
          </div>
          <div className={styles.photos}>
            {photos.map((url, index) => (
              <div key={url}>
                <img src={url} alt={`Branch photo ${index + 1}`} />
                {index === 0 ? <b>Cover</b> : <button type="button" onClick={() => applyPhotos([url, ...photos.filter((_, i) => i !== index)])}>Set cover</button>}
                <button type="button" onClick={() => applyPhotos(photos.filter((_, i) => i !== index))}>Remove</button>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" disabled={busy} onClick={() => void save()}>Save branch</button>
            <button type="button" onClick={() => setEditing(null)}>Cancel</button>
            {editing !== "new" ? <button type="button" className={styles.danger} onClick={() => void remove(editing)}>Delete branch</button> : null}
          </div>
        </div>
      ) : null}
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}
