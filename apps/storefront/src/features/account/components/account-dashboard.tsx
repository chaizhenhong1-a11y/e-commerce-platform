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

export function AccountDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
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

  async function reloadAddresses() {
    setAddresses(await getCustomerAddresses());
  }

  useEffect(() => {
    async function load() {
      try {
        const current = await getCurrentCustomer();
        if (!current) {
          router.replace("/account/sign-in");
          return;
        }
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
      setProfileMessage("Profile updated.");
      router.refresh();
    } catch (cause) {
      setProfileMessage(cause instanceof Error ? cause.message : "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function beginEdit(address: CustomerAddress) {
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

  if (loading) return <div className="cart-loading-card">Loading account…</div>;
  if (!customer) return null;

  return (
    <section className="account-dashboard shell">
      <div className="account-dashboard__header">
        <div>
          <span className="section-kicker">MY ACCOUNT</span>
          <h1>Hello, {customer.firstName}</h1>
          <p>{customer.email}</p>
        </div>
        <button className="button" type="button" onClick={signOut}>Sign out</button>
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

        <section className="account-panel">
          <div className="account-panel__heading">
            <div><span className="section-kicker">ADDRESS BOOK</span><h2>Saved addresses</h2></div>
            <span>{addresses.length}/10</span>
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
        </section>
      </div>

      <div className="account-panel account-orders">
        <div className="account-panel__heading">
          <div>
            <span className="section-kicker">RECENT PURCHASES</span>
            <h2>Recent orders</h2>
          </div>
          <Link className="button" href="/account/orders">
            View all orders
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="account-empty">
            <h3>No account orders yet</h3>
            <p>
              Orders placed while signed in will appear here. Guest orders
              remain separate.
            </p>
            <Link className="button button--primary" href="/#shop">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="account-order-list">
            {orders.slice(0, 3).map((order) => (
              <Link
                className="account-order-row account-order-row--rich"
                href={`/orders/${encodeURIComponent(order.orderNumber)}`}
                key={order.orderNumber}
              >
                <div className="account-order-row__main">
                  <div className="account-order-row__heading">
                    <div>
                      <strong>{order.orderNumber}</strong>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                        {order.itemCount} item
                        {order.itemCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="account-order-row__total">
                      <strong>RM {(order.totalCents / 100).toFixed(2)}</strong>
                      <span>
                        {order.status} · {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="account-order-products">
                    {order.items.slice(0, 2).map((item) => (
                      <span key={item.id}>
                        <strong>{item.productName}</strong>
                        <small>
                          {item.variantName} · SKU {item.sku} · Qty{" "}
                          {item.quantity}
                        </small>
                      </span>
                    ))}
                    {order.items.length > 2 ? (
                      <small>+{order.items.length - 2} more products</small>
                    ) : null}
                  </div>

                  <span className="account-order-row__view">
                    View order details →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
