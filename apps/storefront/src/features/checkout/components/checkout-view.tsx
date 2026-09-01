"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  getCurrentCustomer,
  getCustomerAddresses,
} from "@/features/account/data/account-api";
import type { CustomerAddress } from "@/features/account/domain/account";
import { getCart } from "@/features/cart/data/cart-api";
import {
  getCartSessionId,
  resetCartSession,
} from "@/features/cart/data/cart-session";
import type { Cart } from "@/features/cart/domain/cart";
import { createCheckoutOrder, previewAutomaticPromotion, validateCoupon } from "../data/checkout-api";
import type { AutomaticPromotionPreview, CheckoutOrder, CouponValidation } from "../domain/checkout";

type CheckoutForm = {
  email: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postcode: string;
};

const initialForm: CheckoutForm = {
  email: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postcode: "",
};

function applyAddress(
  current: CheckoutForm,
  address: CustomerAddress,
): CheckoutForm {
  return {
    ...current,
    fullName: address.recipientName,
    phone: address.phone,
    addressLine1: address.line1,
    addressLine2: address.line2 ?? "",
    city: address.city,
    state: address.state,
    postcode: address.postcode,
  };
}

export function CheckoutView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [form, setForm] = useState(initialForm);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<CouponValidation | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [automaticPromotion, setAutomaticPromotion] = useState<AutomaticPromotionPreview | null>(null);

  useEffect(() => {
    const sessionId = getCartSessionId();

    getCart(sessionId)
      .then(setCart)
      .catch((cause) => {
        setError(
          cause instanceof Error ? cause.message : "Unable to load cart.",
        );
      })
      .finally(() => setLoading(false));

    getCurrentCustomer()
      .then(async (customer) => {
        if (!customer) {
          setAuthChecked(true);
          return;
        }

        setSignedIn(true);
        setAuthChecked(true);
        const addresses = await getCustomerAddresses().catch(() => []);
        setSavedAddresses(addresses);

        const defaultAddress =
          addresses.find((address) => address.isDefault) ?? addresses[0];

        setSelectedAddressId(defaultAddress?.id ?? "");
        setForm((current) => {
          const withCustomer = {
            ...current,
            email: current.email || customer.email,
            fullName:
              current.fullName ||
              [customer.firstName, customer.lastName]
                .filter(Boolean)
                .join(" "),
          };

          return defaultAddress
            ? applyAddress(withCustomer, defaultAddress)
            : withCustomer;
        });
      })
      .catch(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!cart?.sessionId) {
      setAutomaticPromotion(null);
      return;
    }
    let cancelled = false;
    previewAutomaticPromotion(cart.sessionId).then((promotion) => {
      if (!cancelled) setAutomaticPromotion(promotion);
    });
    return () => { cancelled = true; };
  }, [cart?.sessionId, cart?.subtotal]);

  function updateField(field: keyof CheckoutForm, value: string) {
    setSelectedAddressId("");
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function selectSavedAddress(addressId: string) {
    const address = savedAddresses.find((item) => item.id === addressId);
    if (!address) return;

    setSelectedAddressId(address.id);
    setForm((current) => applyAddress(current, address));
  }

  async function applyCoupon() {
    if (!cart || !couponCode.trim() || couponBusy) return;
    setCouponBusy(true);
    setCouponError("");
    try {
      const validated = await validateCoupon(cart.sessionId, couponCode.trim());
      setCoupon(validated);
      setCouponCode(validated.code);
    } catch (cause) {
      setCoupon(null);
      setCouponError(cause instanceof Error ? cause.message : "Coupon could not be applied.");
    } finally {
      setCouponBusy(false);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !cart ||
      cart.items.length === 0 ||
      !cart.canCheckout ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const created = await createCheckoutOrder({
        sessionId: cart.sessionId,
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        postcode: form.postcode.trim(),
        countryCode: "MY",
        shippingMethod: "STANDARD",
        couponCode: coupon?.code,
      });

      setOrder(created);
      resetCartSession();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to complete checkout.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authChecked && !signedIn) {
    return (
      <div className="checkout-empty-state">
        <span className="section-kicker">ACCOUNT REQUIRED</span>
        <h2>Sign in to checkout</h2>
        <p>Purchases, payment, delivery addresses, orders, returns, and refunds are tied to your account.</p>
        <Link className="button button--checkout" href="/account/sign-in?returnTo=%2Fcheckout">Sign in to continue</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cart-loading-card">
        <div className="loading-spinner" />
        <span>Preparing secure checkout…</span>
      </div>
    );
  }

  if (order) {
    return (
      <section className="checkout-success">
        <div className="checkout-success__icon">✓</div>
        <span className="section-kicker">ORDER CREATED</span>
        <h2>Thanks, {order.shipping.fullName}.</h2>
        <p>
          Your order has been created and inventory has been reserved while
          payment is pending.
        </p>

        <div className="checkout-success__number">
          <span>Order number</span>
          <strong>{order.orderNumber}</strong>
        </div>

        <div className="checkout-success__summary">
          <div>
            <span>Payment</span>
            <strong>{order.paymentStatus}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>RM {(order.totalCents / 100).toFixed(2)}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{order.email}</strong>
          </div>
        </div>

        <div className="checkout-success__actions">
          <Link
            className="button button--primary"
            href={`/payment?order=${encodeURIComponent(order.orderNumber)}`}
          >
            Continue to payment
          </Link>
          <Link
            className="button"
            href={`/orders/${encodeURIComponent(order.orderNumber)}`}
          >
            View order status
          </Link>
          <Link className="button" href="/#shop">
            Pay later
          </Link>
        </div>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart-card">
        <span className="empty-cart-card__icon">🛒</span>
        <h2>Your cart is empty</h2>
        <p>Add something to your cart before continuing to checkout.</p>
        <Link className="button button--primary" href="/#shop">
          Start shopping
        </Link>
      </div>
    );
  }

  if (!cart.canCheckout) {
    return (
      <section className="checkout-blocked-card">
        <span className="checkout-blocked-card__icon">!</span>
        <span className="section-kicker">CART NEEDS ATTENTION</span>
        <h2>Review your cart before checkout</h2>
        <p>
          {cart.issueCount} item{cart.issueCount === 1 ? "" : "s"} changed
          since you added them. Resolve stock or availability issues first.
        </p>
        <Link className="button button--primary" href="/cart">
          Review cart
        </Link>
      </section>
    );
  }

  const estimatedShipping = cart.subtotal >= 150 ? 0 : 10;
  const selectedDiscount = coupon && (!automaticPromotion || coupon.discountCents >= automaticPromotion.discountCents)
    ? { label: `Coupon ${coupon.code}`, cents: coupon.discountCents, automatic: false }
    : automaticPromotion
      ? { label: automaticPromotion.name, cents: automaticPromotion.discountCents, automatic: true }
      : null;
  const estimatedDiscount = (selectedDiscount?.cents ?? 0) / 100;
  const estimatedTotal = Math.max(0, cart.subtotal + estimatedShipping - estimatedDiscount);

  return (
    <form className="checkout-layout" onSubmit={submit}>
      <div className="checkout-form-column">
        <section className="checkout-section-card">
          <div className="checkout-section-card__heading">
            <span>01</span>
            <div>
              <h2>Contact</h2>
              <p>We&apos;ll use this for your order updates.</p>
            </div>
          </div>

          <div className="checkout-field-grid">
            <label className="checkout-field checkout-field--full">
              <span>Email address</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="checkout-field">
              <span>Full name</span>
              <input
                required
                autoComplete="name"
                value={form.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                placeholder="Your full name"
              />
            </label>

            <label className="checkout-field">
              <span>Phone number</span>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                placeholder="+60 12 345 6789"
              />
            </label>
          </div>
        </section>

        {signedIn ? (
          <section className="checkout-section-card">
            <div className="checkout-section-card__heading">
              <span>02</span>
              <div>
                <h2>Saved addresses</h2>
                <p>
                  Select an account address or edit the delivery fields below.
                </p>
              </div>
            </div>

            {savedAddresses.length > 0 ? (
              <div className="checkout-address-grid">
                {savedAddresses.map((address) => {
                  const selected = selectedAddressId === address.id;
                  return (
                    <button
                      type="button"
                      className={[
                        "checkout-address-option",
                        selected
                          ? "checkout-address-option--selected"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      aria-pressed={selected}
                      key={address.id}
                      onClick={() => selectSavedAddress(address.id)}
                    >
                      <span className="checkout-address-option__heading">
                        <strong>{address.label}</strong>
                        {address.isDefault ? <small>Default</small> : null}
                      </span>
                      <span>{address.recipientName}</span>
                      <span>{address.line1}</span>
                      <span>
                        {address.postcode} {address.city}, {address.state}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="checkout-address-empty">
                <span>No saved addresses yet.</span>
                <Link href="/account">Add one in Account</Link>
              </div>
            )}

            {savedAddresses.length > 0 ? (
              <Link className="checkout-manage-link" href="/account">
                Manage saved addresses
              </Link>
            ) : null}
          </section>
        ) : null}

        <section className="checkout-section-card">
          <div className="checkout-section-card__heading">
            <span>{signedIn ? "03" : "02"}</span>
            <div>
              <h2>Shipping address</h2>
              <p>Currently configured for Malaysian deliveries.</p>
            </div>
          </div>

          <div className="checkout-field-grid">
            <label className="checkout-field checkout-field--full">
              <span>Address line 1</span>
              <input
                required
                autoComplete="address-line1"
                value={form.addressLine1}
                onChange={(event) =>
                  updateField("addressLine1", event.target.value)
                }
                placeholder="Street address"
              />
            </label>

            <label className="checkout-field checkout-field--full">
              <span>
                Address line 2 <small>Optional</small>
              </span>
              <input
                autoComplete="address-line2"
                value={form.addressLine2}
                onChange={(event) =>
                  updateField("addressLine2", event.target.value)
                }
                placeholder="Apartment, suite, unit"
              />
            </label>

            <label className="checkout-field">
              <span>City</span>
              <input
                required
                autoComplete="address-level2"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                placeholder="Kuala Lumpur"
              />
            </label>

            <label className="checkout-field">
              <span>State</span>
              <input
                required
                autoComplete="address-level1"
                value={form.state}
                onChange={(event) => updateField("state", event.target.value)}
                placeholder="Selangor"
              />
            </label>

            <label className="checkout-field">
              <span>Postcode</span>
              <input
                required
                autoComplete="postal-code"
                value={form.postcode}
                onChange={(event) =>
                  updateField("postcode", event.target.value)
                }
                placeholder="50000"
              />
            </label>

            <label className="checkout-field">
              <span>Country</span>
              <input value="Malaysia" disabled />
            </label>
          </div>
        </section>

        <section className="checkout-section-card">
          <div className="checkout-section-card__heading">
            <span>{signedIn ? "04" : "03"}</span>
            <div>
              <h2>Delivery method</h2>
              <p>
                Shipping is verified again by the server when you place the
                order.
              </p>
            </div>
          </div>

          <label className="shipping-option shipping-option--selected">
            <input type="radio" checked readOnly />
            <div>
              <strong>Standard delivery</strong>
              <span>Estimated 2–5 working days</span>
            </div>
            <strong>
              {estimatedShipping === 0
                ? "FREE"
                : `RM ${estimatedShipping.toFixed(2)}`}
            </strong>
          </label>
        </section>
      </div>

      <aside className="checkout-order-card">
        <span className="section-kicker">YOUR ORDER</span>
        <h2>Order review</h2>

        <div className="checkout-order-items">
          {cart.items.map((item) => (
            <div className="checkout-order-item" key={item.id}>
              <div className="checkout-order-item__media">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" />
                ) : (
                  item.productName.slice(0, 1)
                )}
                <span>{item.quantity}</span>
              </div>
              <div>
                <strong>{item.productName}</strong>
                <span>
                  {item.variantName} · {item.sku}
                </span>
                <small>{item.availableStock} available</small>
              </div>
              <strong>RM {(item.price * item.quantity).toFixed(2)}</strong>
            </div>
          ))}
        </div>

        {automaticPromotion ? (
          <div className="checkout-coupon__success">
            <strong>Automatic discount applied</strong> · {automaticPromotion.name} · RM {(automaticPromotion.discountCents / 100).toFixed(2)} off. No coupon code required.
          </div>
        ) : null}

        <div className="checkout-coupon">
          <label htmlFor="checkout-coupon-code">Coupon code</label>
          <div className="checkout-coupon__row">
            <input
              id="checkout-coupon-code"
              value={couponCode}
              disabled={couponBusy}
              onChange={(event) => {
                setCouponCode(event.target.value.toUpperCase());
                if (coupon) setCoupon(null);
                setCouponError("");
              }}
              placeholder="WELCOME10"
            />
            {coupon ? (
              <button type="button" onClick={removeCoupon}>Remove</button>
            ) : (
              <button type="button" disabled={!couponCode.trim() || couponBusy} onClick={() => void applyCoupon()}>
                {couponBusy ? "Checking…" : "Apply"}
              </button>
            )}
          </div>
          {coupon ? <p className="checkout-coupon__success"><strong>{coupon.code}</strong> applied · RM {(coupon.discountCents / 100).toFixed(2)} off</p> : null}
          {couponError ? <p className="checkout-coupon__error">{couponError}</p> : null}
        </div>

        <div className="checkout-order-totals">
          <div>
            <span>Subtotal</span>
            <span>RM {cart.subtotal.toFixed(2)}</span>
          </div>
          <div>
            <span>Shipping</span>
            <span>
              {estimatedShipping === 0
                ? "Free"
                : `RM ${estimatedShipping.toFixed(2)}`}
            </span>
          </div>
          {selectedDiscount ? (
            <div className="checkout-order-totals__discount">
              <span>{selectedDiscount.automatic ? "Automatic promotion" : "Discount"} ({selectedDiscount.label})</span>
              <span>− RM {estimatedDiscount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="checkout-order-totals__grand">
            <strong>Total</strong>
            <strong>RM {estimatedTotal.toFixed(2)}</strong>
          </div>
        </div>

        <p className="checkout-reprice-note">
          Final price, product availability, and inventory are revalidated by
          TextShop when this order is submitted.
        </p>

        {error ? <p className="form-error">{error}</p> : null}

        <button
          className="button button--checkout"
          type="submit"
          disabled={submitting || !cart.canCheckout}
        >
          {submitting ? "Creating order…" : "Place order"}
        </button>

        <div className="checkout-trust checkout-trust--stacked">
          <span>🔒 Server-validated totals</span>
          <span>✓ Inventory reserved for 30 minutes on success</span>
        </div>
      </aside>
    </form>
  );
}
