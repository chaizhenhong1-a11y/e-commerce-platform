"use client";

import { FormEvent, useEffect, useState } from "react";
import type { StoreSettings, UpdateStoreSettingsInput } from "../domain/store-settings";
import { StaffNav } from "./staff-nav";
import { StoreLocationsManager } from "./store-locations-manager";
import consoleStyles from "./staff-console.module.css";
import styles from "./store-settings.module.css";

function normalizeGallery(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

const EMPTY: UpdateStoreSettingsInput = {
  storeName: "TextShop",
  logoUrl: "",
  storeCoverUrl: "",
  storeGalleryUrls: [],
  storeTagline: "",
  storeDescription: "",
  contactEmail: "",
  contactPhone: "",
  businessHours: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postcode: "",
  countryCode: "MY",
  currency: "MYR",
  timeZone: "Asia/Kuala_Lumpur",
  standardShippingCents: 0,
  freeShippingThresholdCents: 0,
  deliveryPolicy: "",
  returnsPolicy: "",
  faqContent: "",
  trustSafetyContent: "",
  termsContent: "",
  privacyContent: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
};

export function StoreSettingsManager() {
  const [form, setForm] = useState<UpdateStoreSettingsInput>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/staff/settings", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as StoreSettings | null;
        if (!response.ok || !payload) throw new Error((payload as { message?: string } | null)?.message ?? "Unable to load store settings.");
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...editable } = payload;
        setForm({
          ...EMPTY,
          ...editable,
          storeGalleryUrls: normalizeGallery(editable.storeGalleryUrls),
        });
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load store settings."))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof UpdateStoreSettingsInput>(key: K, value: UpdateStoreSettingsInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadLogo(file: File | undefined) {
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/staff/settings/media", { method: "POST", body });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.message ?? "Unable to upload store logo.");
      }
      set("logoUrl", payload.url);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to upload store logo.");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/staff/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save store settings.");
      setMessage("Store settings saved. Customer information is now shared by Web and Flutter.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to save store settings.");
    } finally {
      setSaving(false);
    }
  }

  const input = (label: string, key: keyof UpdateStoreSettingsInput, options?: { type?: string; required?: boolean; maxLength?: number }) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type={options?.type}
        required={options?.required}
        maxLength={options?.maxLength}
        value={String(form[key])}
        min={options?.type === "number" ? 0 : undefined}
        onChange={(e) => {
          const raw = options?.type === "number" ? Number(e.target.value) : e.target.value;
          const normalized = key === "countryCode" || key === "currency"
            ? String(raw).toUpperCase()
            : raw;
          set(key, normalized as never);
        }}
      />
    </label>
  );

  const textarea = (label: string, key: keyof UpdateStoreSettingsInput, rows = 5) => (
    <label className={`${styles.field} ${styles.full}`}>
      <span>{label}</span>
      <textarea rows={rows} value={String(form[key])} onChange={(e) => set(key, e.target.value as never)} />
    </label>
  );

  return (
    <main className={consoleStyles.shell}>
      <StaffNav active="settings" />
      <header className={consoleStyles.header}>
        <div>
          <span className={consoleStyles.eyebrow}>STORE SETTINGS</span>
          <h1>Shop configuration</h1>
          <p>Manage public store details, customer support content, commerce defaults, and contact information from one place.</p>
        </div>
      </header>

      {loading ? <div className={consoleStyles.empty}>Loading settings…</div> : null}
      {!loading ? (
        <form className={styles.form} onSubmit={submit}>
          <section className={styles.section}>
            <h2>Brand & public store profile</h2>
            <div className={styles.grid}>
              {input("Store name", "storeName", { required: true })}
              <div className={`${styles.full} ${styles.logoManager}`}>
                <span className={styles.photoLabel}>Store logo</span>
                <p>Upload the logo customers should see across TextShop. The image URL is managed automatically.</p>
                {form.logoUrl ? (
                  <div className={styles.logoPreview}>
                    <img src={form.logoUrl} alt="Current store logo" />
                    <div className={styles.logoActions}>
                      <label className={styles.uploadButton}>
                        {uploadingLogo ? "Uploading…" : "Replace logo"}
                        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingLogo} onChange={(event) => { void uploadLogo(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                      </label>
                      <button type="button" className={styles.removeLogoButton} onClick={() => set("logoUrl", "")}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className={styles.uploadButton}>
                    {uploadingLogo ? "Uploading…" : "Upload logo"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploadingLogo} onChange={(event) => { void uploadLogo(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                  </label>
                )}
              </div>
              {input("Store tagline", "storeTagline")}
              {input("Customer support hours", "businessHours")}
              {textarea("About the store", "storeDescription", 7)}
              <StoreLocationsManager />
            </div>
          </section>

          <section className={styles.section}>
            <h2>Contact</h2>
            <div className={styles.grid}>
              {input("Contact email", "contactEmail", { type: "email", required: true })}
              {input("Contact phone", "contactPhone")}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Commerce & delivery</h2>
            <div className={styles.grid}>
              {input("Currency", "currency", { required: true, maxLength: 3 })}
              {input("Timezone", "timeZone", { required: true })}
              {input("Standard shipping (cents)", "standardShippingCents", { type: "number", required: true })}
              {input("Free shipping threshold (cents)", "freeShippingThresholdCents", { type: "number", required: true })}
              {textarea("Delivery information", "deliveryPolicy", 6)}
              {textarea("Returns information", "returnsPolicy", 6)}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Customer information pages</h2>
            <div className={styles.grid}>
              {textarea("FAQ", "faqContent", 8)}
              {textarea("Trust & safety", "trustSafetyContent", 6)}
              {textarea("Terms", "termsContent", 10)}
              {textarea("Privacy", "privacyContent", 10)}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Social links</h2>
            <div className={styles.grid}>
              {input("Instagram URL", "instagramUrl")}
              {input("Facebook URL", "facebookUrl")}
              {input("TikTok URL", "tiktokUrl")}
            </div>
          </section>

          <div className={styles.actions}>
            <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</button>
            {message ? <span className={styles.success}>{message}</span> : null}
            {error ? <span className={styles.error}>{error}</span> : null}
          </div>
        </form>
      ) : null}
    </main>
  );
}
