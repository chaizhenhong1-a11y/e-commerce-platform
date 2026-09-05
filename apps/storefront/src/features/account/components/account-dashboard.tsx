"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  getCurrentCustomer,
  getCustomerAddresses,
  getCustomerOrders,
  logoutCustomer,
  resendVerificationEmail,
  setDefaultCustomerAddress,
  updateCustomerAddress,
  updateCustomerProfile,
} from "../data/account-api";
import {
  accountRouteCacheKeys,
  markAccountSignedIn,
  markAccountSignedOut,
  readAccountAuthState,
  readAccountRouteCache,
  writeAccountRouteCache,
} from "../lib/account-route-cache";
import type {
  Customer,
  CustomerAddress,
  CustomerAddressInput,
  CustomerOrder,
} from "../domain/account";

const emptyAddress: CustomerAddressInput = {
  label: "Home",
  recipientName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postcode: "",
  countryCode: "MY",
  isDefault: false,
};

type AccountDashboardSnapshot = {
  customer: Customer;
  orders: CustomerOrder[];
  addresses: CustomerAddress[];
};

export function AccountDashboard() {
  const router = useRouter();
  const initialSnapshot = readAccountRouteCache<AccountDashboardSnapshot>(
    accountRouteCacheKeys.dashboard,
  );
  const [customer, setCustomer] = useState<Customer | null>(
    initialSnapshot?.customer ?? null,
  );
  const [orders, setOrders] = useState<CustomerOrder[]>(
    initialSnapshot?.orders ?? [],
  );
  const [addresses, setAddresses] = useState<CustomerAddress[]>(
    initialSnapshot?.addresses ?? [],
  );
  const initialAuthState = readAccountAuthState();
  const [signedOut, setSignedOut] = useState(initialAuthState === "signed-out");
  const [loading, setLoading] = useState(!initialSnapshot && initialAuthState !== "signed-out");
  const [error, setError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profile, setProfile] = useState({ firstName: "", lastName: "" });
  const [addressForm, setAddressForm] = useState<CustomerAddressInput>(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);

  function cacheSnapshot(
    nextCustomer: Customer,
    nextOrders: CustomerOrder[],
    nextAddresses: CustomerAddress[],
  ) {
    writeAccountRouteCache<AccountDashboardSnapshot>(
      accountRouteCacheKeys.dashboard,
      {
        customer: nextCustomer,
        orders: nextOrders,
        addresses: nextAddresses,
      },
    );
    writeAccountRouteCache<CustomerOrder[]>(
      accountRouteCacheKeys.orders,
      nextOrders,
    );
  }

  async function reloadAddresses() {
    const nextAddresses = await getCustomerAddresses();
    setAddresses(nextAddresses);
    if (customer) cacheSnapshot(customer, orders, nextAddresses);
  }

  useEffect(() => {
    if (readAccountAuthState() === "signed-out") return;
    async function load() {
      try {
        const current = await getCurrentCustomer();
        if (!current) {
          markAccountSignedOut();
          setSignedOut(true);
          return;
        }
        markAccountSignedIn();
        setCustomer(current);
        setProfile({
          firstName: current.firstName,
          lastName: current.lastName ?? "",
        });
        const [nextOrders, nextAddresses] = await Promise.all([
          getCustomerOrders(),
          getCustomerAddresses(),
        ]);
        setOrders(nextOrders);
        setAddresses(nextAddresses);
        cacheSnapshot(current, nextOrders, nextAddresses);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to load account.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [router]);

  const fullName = useMemo(
    () => [customer?.firstName, customer?.lastName].filter(Boolean).join(" "),
    [customer],
  );

  async function signOut() {
    await logoutCustomer();
    router.replace("/");
    router.refresh();
  }

  async function resendVerification() {
    if (resending) return;
    setResending(true);
    setVerificationMessage("");
    try {
      const result = await resendVerificationEmail();
      setVerificationMessage(
        result.alreadyVerified
          ? "Your email is already verified. Refreshing account…"
          : "Verification email requested. Check your inbox or the API console in local development.",
      );
      if (result.alreadyVerified) router.refresh();
    } catch (cause) {
      setVerificationMessage(
        cause instanceof Error ? cause.message : "Unable to resend verification email.",
      );
    } finally {
      setResending(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    setProfileMessage("");
    try {
      const updated = await updateCustomerProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim() || undefined,
      });
      setCustomer(updated);
      cacheSnapshot(updated, orders, addresses);
      setProfileMessage("Profile updated.");
      router.refresh();
    } catch (cause) {
      setProfileMessage(cause instanceof Error ? cause.message : "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function beginEdit(address: CustomerAddress) {
    setShowAddressForm(true);
    setEditingAddressId(address.id);
    setAddressForm({
      label: address.label,
      recipientName: address.recipientName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      countryCode: "MY",
      isDefault: address.isDefault,
    });
    setAddressMessage("");
  }

  function resetAddressForm() {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm({
      ...emptyAddress,
      recipientName: fullName,
      isDefault: addresses.length === 0,
    });
    setAddressMessage("");
  }

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingAddress) return;
    setSavingAddress(true);
    setAddressMessage("");
    try {
      if (editingAddressId) {
        await updateCustomerAddress(editingAddressId, addressForm);
      } else {
        await createCustomerAddress(addressForm);
      }
      await reloadAddresses();
      setEditingAddressId(null);
      setShowAddressForm(false);
      setAddressForm({ ...emptyAddress, recipientName: fullName });
      setAddressMessage(editingAddressId ? "Address updated." : "Address saved.");
    } catch (cause) {
      setAddressMessage(cause instanceof Error ? cause.message : "Unable to save address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function makeDefault(id: string) {
    try {
      await setDefaultCustomerAddress(id);
      await reloadAddresses();
    } catch (cause) {
      setAddressMessage(cause instanceof Error ? cause.message : "Unable to set default address.");
    }
  }

  async function removeAddress(id: string) {
    if (!window.confirm("Remove this saved address?")) return;
    try {
      await deleteCustomerAddress(id);
      await reloadAddresses();
      if (editingAddressId === id) resetAddressForm();
    } catch (cause) {
      setAddressMessage(cause instanceof Error ? cause.message : "Unable to delete address.");
    }
  }

  if (signedOut) return (
    <section className="account-dashboard account-dashboard--guest shell">
      <div className="account-guest-card">
        <div className="account-guest-card__content">
          <span className="account-guest-card__kicker">YOUR ACCOUNT</span>
          <h1>Sign in to manage your account.</h1>
          <p>Access purchases, saved addresses and profile details from your TextShop account.</p>
          <Link
            className="button button--primary"
            href="/account/sign-in?returnTo=%2Faccount"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
  if (loading) return <div className="cart-loading-card">Loading account…</div>;
  if (!customer) return null;

  return (
    <section className="account-dashboard shell">
      <div className="account-hero">
        <div className="account-hero__identity">
          <span className="section-kicker">MY ACCOUNT</span>
          <h1>Hello, {customer.firstName}</h1>
          <p>{customer.email}</p>
          <div className="account-hero__status">
            <span>{customer.emailVerified ? "Verified email" : "Email verification pending"}</span>
            <span>{addresses.length} saved address{addresses.length === 1 ? "" : "es"}</span>
            <span>{orders.length} order{orders.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className="account-hero__actions">
          {customer.role === "STAFF" || customer.role === "ADMIN" ? (
            <Link className="button account-hero__staff" href="/staff/returns">Staff operations</Link>
          ) : null}
          <button className="button account-hero__signout" type="button" onClick={signOut}>Sign out</button>
        </div>
      </div>

      {!customer.emailVerified ? (
        <div className="account-verification-banner">
          <div>
            <strong>Verify your email</strong>
            <span>Verify {customer.email} to secure account recovery and future account communications.</span>
            {verificationMessage ? <small>{verificationMessage}</small> : null}
          </div>
          <button className="button" type="button" disabled={resending} onClick={resendVerification}>
            {resending ? "Sending…" : "Resend verification"}
          </button>
        </div>
      ) : (
        <div className="account-verification-banner account-verification-banner--verified">
          <div><strong>Email verified</strong><span>Your account email has been verified.</span></div>
        </div>
      )}

      {error ? <p className="form-error">{error}</p> : null}

      <div className="account-settings-grid">
        <form className="account-panel account-profile-card" onSubmit={saveProfile}>
          <div className="account-panel__heading">
            <div><span className="section-kicker">PROFILE</span><h2>Personal details</h2></div>
          </div>
          <div className="checkout-field-grid">
            <label className="checkout-field">
              <span>First name</span>
              <input
                required
                value={profile.firstName}
                onChange={(event) => setProfile((current) => ({ ...current, firstName: event.target.value }))}
              />
            </label>
            <label className="checkout-field">
              <span>Last name</span>
              <input
                value={profile.lastName}
                onChange={(event) => setProfile((current) => ({ ...current, lastName: event.target.value }))}
              />
            </label>
            <label className="checkout-field checkout-field--full">
              <span>Email address</span>
              <input value={customer.email} disabled />
              <small>Email changes will use a separate verified-email workflow later.</small>
            </label>
          </div>
          {profileMessage ? <p className="account-inline-message">{profileMessage}</p> : null}
          <button className="button button--primary" type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving…" : "Save profile"}
          </button>
        </form>

        <section className="account-panel account-address-panel" id="address-book">
          <div className="account-panel__heading">
            <div><span className="section-kicker">ADDRESS BOOK</span><h2>Saved addresses</h2></div>
            <div className="account-panel__heading-actions">
              <span>{addresses.length}/10</span>
              {!showAddressForm ? (
                <button className="button button--primary button--small" type="button" onClick={() => {
                  setEditingAddressId(null);
                  setAddressForm({ ...emptyAddress, recipientName: fullName, isDefault: addresses.length === 0 });
                  setAddressMessage("");
                  setShowAddressForm(true);
                }}>Add address</button>
              ) : null}
            </div>
          </div>

          {addresses.length === 0 ? (
            <div className="account-empty account-empty--compact">
              <h3>No saved addresses</h3>
              <p>Add an address once and reuse it at checkout.</p>
            </div>
          ) : (
            <div className="address-book-list">
              {addresses.map((address) => (
                <article className={`address-card${address.isDefault ? " address-card--default" : ""}`} key={address.id}>
                  <div className="address-card__heading">
                    <div>
                      <strong>{address.label}</strong>
                      {address.isDefault ? <span className="address-default-badge">Default</span> : null}
                    </div>
                    <span>{address.recipientName}</span>
                  </div>
                  <p>{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                  <p>{address.postcode} {address.city}, {address.state}</p>
                  <p>{address.phone}</p>
                  <div className="address-card__actions">
                    <button type="button" className="button button--small" onClick={() => beginEdit(address)}>Edit</button>
                    {!address.isDefault ? <button type="button" className="button button--small" onClick={() => void makeDefault(address.id)}>Make default</button> : null}
                    <button type="button" className="button button--small button--danger" onClick={() => void removeAddress(address.id)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {showAddressForm ? (
          <form className="address-form" onSubmit={saveAddress}>
            <div className="account-panel__heading account-panel__heading--sub">
              <div><h3>{editingAddressId ? "Edit address" : "Add address"}</h3></div>
              {editingAddressId ? <button className="text-button" type="button" onClick={resetAddressForm}>Cancel</button> : null}
            </div>
            <div className="checkout-field-grid">
              <label className="checkout-field">
                <span>Label</span>
                <input required value={addressForm.label} onChange={(e) => setAddressForm((v) => ({ ...v, label: e.target.value }))} placeholder="Home" />
              </label>
              <label className="checkout-field">
                <span>Recipient name</span>
                <input required value={addressForm.recipientName} onChange={(e) => setAddressForm((v) => ({ ...v, recipientName: e.target.value }))} />
              </label>
              <label className="checkout-field">
                <span>Phone</span>
                <input required type="tel" value={addressForm.phone} onChange={(e) => setAddressForm((v) => ({ ...v, phone: e.target.value }))} />
              </label>
              <label className="checkout-field checkout-field--full">
                <span>Address line 1</span>
                <input required value={addressForm.line1} onChange={(e) => setAddressForm((v) => ({ ...v, line1: e.target.value }))} />
              </label>
              <label className="checkout-field checkout-field--full">
                <span>Address line 2 <small>Optional</small></span>
                <input value={addressForm.line2 ?? ""} onChange={(e) => setAddressForm((v) => ({ ...v, line2: e.target.value }))} />
              </label>
              <label className="checkout-field">
                <span>City</span>
                <input required value={addressForm.city} onChange={(e) => setAddressForm((v) => ({ ...v, city: e.target.value }))} />
              </label>
              <label className="checkout-field">
                <span>State</span>
                <input required value={addressForm.state} onChange={(e) => setAddressForm((v) => ({ ...v, state: e.target.value }))} />
              </label>
              <label className="checkout-field">
                <span>Postcode</span>
                <input required value={addressForm.postcode} onChange={(e) => setAddressForm((v) => ({ ...v, postcode: e.target.value }))} />
              </label>
              <label className="checkout-field">
                <span>Country</span>
                <input value="Malaysia" disabled />
              </label>
            </div>
            <label className="account-checkbox">
              <input type="checkbox" checked={Boolean(addressForm.isDefault)} onChange={(e) => setAddressForm((v) => ({ ...v, isDefault: e.target.checked }))} />
              <span>Use as my default delivery address</span>
            </label>
            {addressMessage ? <p className="account-inline-message">{addressMessage}</p> : null}
            <button className="button button--primary" type="submit" disabled={savingAddress}>
              {savingAddress ? "Saving…" : editingAddressId ? "Update address" : "Save address"}
            </button>
          </form>
          ) : null}
        </section>
      </div>

          </section>
  );
}
