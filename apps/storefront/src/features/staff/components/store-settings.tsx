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

type SettingsForm = Omit<UpdateStoreSettingsInput, "standardShippingCents" | "freeShippingThresholdCents"> & {
  standardShippingMyr: string;
  freeShippingFromMyr: string;
};

function shippingCents(value: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new Error("Enter a non-negative shipping amount in MYR with at most two decimal places.");
  }
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) throw new Error("Shipping amount is too large.");
  return cents;
}

const EMPTY: SettingsForm = {
  storeName: "Elvane",
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
  standardShippingMyr: "0.00",
  freeShippingFromMyr: "0.00",
  estimatedDelivery: "",
  deliveryPolicy: "",
  returnWindowDays: 0,
  returnCondition: "",
  refundMethod: "",
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
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<SettingsForm | null>(null);

  useEffect(() => {
    void fetch("/api/staff/settings", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as StoreSettings | null;
        if (!response.ok || !payload) throw new Error((payload as { message?: string } | null)?.message ?? "Unable to load store settings.");
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, standardShippingCents, freeShippingThresholdCents, ...editable } = payload;
        const nextForm = {
          ...EMPTY,
          ...editable,
          standardShippingMyr: (standardShippingCents / 100).toFixed(2),
          freeShippingFromMyr: (freeShippingThresholdCents / 100).toFixed(2),
          storeGalleryUrls: normalizeGallery(editable.storeGalleryUrls),
        };
        setForm(nextForm);
        setInitialForm(nextForm);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load store settings."))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) {
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
      const { standardShippingMyr, freeShippingFromMyr, ...settings } = form;
      const body: UpdateStoreSettingsInput = {
        ...settings,
        standardShippingCents: shippingCents(standardShippingMyr),
        freeShippingThresholdCents: shippingCents(freeShippingFromMyr),
      };
      const response = await fetch("/api/staff/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message ?? "Unable to save store settings.");
      setInitialForm(form);
      setMessage("Store settings saved. Customer information is now shared by Web and Flutter.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to save store settings.");
    } finally {
      setSaving(false);
    }
  }

  const isDirty = initialForm !== null && JSON.stringify(initialForm) !== JSON.stringify(form);

  const completion = {
    brand: Boolean(form.storeName.trim() && form.storeDescription.trim()),
    contact: Boolean(form.contactEmail.trim()),
    commerce: Boolean(form.currency.trim() && form.timeZone.trim()),
    delivery: Boolean(form.estimatedDelivery.trim() || form.deliveryPolicy.trim()),
    returns: Boolean(Number(form.returnWindowDays) > 0 || form.returnsPolicy.trim()),
    content: Boolean(form.faqContent.trim() || form.termsContent.trim() || form.privacyContent.trim()),
    social: Boolean(form.instagramUrl.trim() || form.facebookUrl.trim() || form.tiktokUrl.trim()),
  };

  const completeCount = Object.values(completion).filter(Boolean).length;
  const totalSections = Object.keys(completion).length;

  const input = (label: string, key: keyof SettingsForm, options?: { type?: string; required?: boolean; maxLength?: number; hint?: string }) => (
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
      {options?.hint ? <small className={styles.hint}>{options.hint}</small> : null}
    </label>
  );

  const shippingInput = (label: string, key: "standardShippingMyr" | "freeShippingFromMyr", hint: string) => (
    <label className={styles.field}>
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        required
        value={form[key]}
        onChange={(event) => set(key, event.target.value)}
        onBlur={() => {
          if (/^\d+(?:\.\d{1,2})?$/.test(form[key])) set(key, Number(form[key]).toFixed(2));
        }}
      />
      <small className={styles.hint}>{hint}</small>
    </label>
  );

  const textarea = (label: string, key: keyof SettingsForm, rows = 5) => (
    <label className={`${styles.field} ${styles.full}`}>
      <span>{label}</span>
      <textarea rows={rows} value={String(form[key])} onChange={(e) => set(key, e.target.value as never)} />
    </label>
  );

  return (
    <main className={consoleStyles.shell}>
      <StaffNav active="settings" />
      <div className={`${consoleStyles.staffWorkspace} ${styles.workspace}`}>
        <header className={consoleStyles.header}>
          <div>
            <span className={consoleStyles.eyebrow}>STORE SETTINGS</span>
            <h1>Store configuration</h1>
            <p>One source of truth for your public brand, support details, commerce defaults, delivery, returns, and customer information.</p>
          </div>
          <div className={styles.headerStatus}>
            <span>{completeCount}/{totalSections} sections configured</span>
            <strong className={isDirty ? styles.unsaved : styles.saved}>
              {isDirty ? "Unsaved changes" : "Up to date"}
            </strong>
          </div>
        </header>

        {loading ? <div className={consoleStyles.empty}>Loading settings…</div> : null}
        {!loading ? (
          <div className={styles.layout}>
            <aside className={styles.sectionNav}>
              <span className={styles.navTitle}>Settings</span>
              {[
                ["brand", "Brand & profile", completion.brand],
                ["contact", "Contact", completion.contact],
                ["commerce", "Commerce", completion.commerce],
                ["delivery", "Delivery", completion.delivery],
                ["returns", "Returns", completion.returns],
                ["content", "Customer pages", completion.content],
                ["social", "Social links", completion.social],
              ].map(([id, label, complete]) => (
                <a href={`#settings-${id}`} key={String(id)}>
                  <span>{String(label)}</span>
                  <b className={complete ? styles.navComplete : styles.navIncomplete}>
                    {complete ? "Ready" : "Review"}
                  </b>
                </a>
              ))}
            </aside>

            <form className={styles.form} onSubmit={submit}>
          <section id="settings-brand" className={styles.section}>
            <h2>Brand & public store profile</h2>
            <div className={styles.grid}>
              {input("Store name", "storeName", { required: true })}
              <div className={`${styles.full} ${styles.logoManager}`}>
                <span className={styles.photoLabel}>Store logo</span>
                <p>Upload the logo customers should see across Elvane. The image URL is managed automatically.</p>
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

          <section id="settings-contact" className={styles.section}>
            <h2>Contact</h2>
            <div className={styles.grid}>
              {input("Contact email", "contactEmail", { type: "email", required: true })}
              {input("Contact phone", "contactPhone")}
            </div>
          </section>

          <section id="settings-commerce" className={styles.section}>
            <div className={styles.sectionHeading}>
              <div><span className={styles.kicker}>COMMERCE</span><h2>Commerce defaults</h2></div>
              <p>System-level defaults used by pricing, checkout, and store operations.</p>
            </div>
            <div className={styles.grid}>
              {input("Currency", "currency", { required: true, maxLength: 3, hint: "Three-letter ISO code, for example MYR." })}
              {input("Timezone", "timeZone", { required: true, hint: "Used for store operations and reporting." })}
            </div>
          </section>

          <section id="settings-delivery" className={styles.section}>
            <div className={styles.sectionHeading}>
              <div><span className={styles.kicker}>DELIVERY</span><h2>Delivery settings</h2></div>
              <p>Configure customer-facing shipping prices, eligibility, timing, and delivery guidance.</p>
            </div>
            <div className={styles.grid}>
              {shippingInput("Standard shipping fee (MYR)", "standardShippingMyr", "Enter the shipping fee in RM, for example 8.00.")}
              {shippingInput("Free shipping from (MYR)", "freeShippingFromMyr", "Enter the order amount in RM, for example 150.00. Set 0.00 to hide the free-delivery threshold.")}
              {input("Estimated delivery", "estimatedDelivery", { maxLength: 120, hint: "Example: 2–5 business days after dispatch." })}
              {textarea("Delivery information", "deliveryPolicy", 6)}
            </div>
          </section>

          <section id="settings-returns" className={styles.section}>
            <div className={styles.sectionHeading}>
              <div><span className={styles.kicker}>RETURNS</span><h2>Returns settings</h2></div>
              <p>Define the structured rules customers see before reading the full returns information.</p>
            </div>
            <div className={styles.grid}>
              {input("Return window (days)", "returnWindowDays", { type: "number", required: true, hint: Number(form.returnWindowDays || 0) > 0 ? `Customers see a ${form.returnWindowDays}-day return window.` : "Set 0 if no standard return window should be shown." })}
              {input("Return item condition", "returnCondition", { maxLength: 180, hint: "Example: Unused, original condition and packaging." })}
              {input("Refund method", "refundMethod", { maxLength: 180, hint: "Example: Original payment method." })}
              {textarea("Returns information", "returnsPolicy", 6)}
            </div>
          </section>

          <section id="settings-content" className={styles.section}>
            <h2>Customer information pages</h2>
            <div className={styles.grid}>
              {textarea("FAQ", "faqContent", 8)}
              {textarea("Trust & safety", "trustSafetyContent", 6)}
              {textarea("Terms", "termsContent", 10)}
              {textarea("Privacy", "privacyContent", 10)}
            </div>
          </section>

          <section id="settings-social" className={styles.section}>
            <h2>Social links</h2>
            <div className={styles.grid}>
              {input("Instagram URL", "instagramUrl")}
              {input("Facebook URL", "facebookUrl")}
              {input("TikTok URL", "tiktokUrl")}
            </div>
          </section>

          <div className={styles.actions}>
            <div>
              <strong>{isDirty ? "You have unsaved changes." : "All store settings are saved."}</strong>
              <span>Updates are shared with customer-facing Web and Flutter where applicable.</span>
            </div>
            <button type="submit" disabled={saving || !isDirty}>{saving ? "Saving…" : "Save settings"}</button>
            {message ? <span className={styles.success}>{message}</span> : null}
            {error ? <span className={styles.error}>{error}</span> : null}
          </div>
            </form>
          </div>
        ) : null}
      </div>
    </main>
  );
}
