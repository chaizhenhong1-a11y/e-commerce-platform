"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrentCustomer } from "@/features/account/data/account-api";
import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "../data/cart-api";
import { getCartSessionId } from "../data/cart-session";
import type { Cart } from "../domain/cart";
import {
  accountRouteCacheKeys,
  markAccountSignedIn,
  markAccountSignedOut,
  readAccountAuthState,
  readAccountRouteCache,
  writeAccountRouteCache,
} from "@/features/account/lib/account-route-cache";

export function CartView() {
  const cachedCart = readAccountRouteCache<Cart>(accountRouteCacheKeys.cart);
  const [cart, setCart] = useState<Cart | null>(cachedCart ?? null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const initialAuthState = readAccountAuthState();
  const [signedOut, setSignedOut] = useState(initialAuthState === "signed-out");

  useEffect(() => {
    let active = true;
    if (readAccountAuthState() === "signed-out") return;
    void (async () => {
      const customer = await getCurrentCustomer().catch(() => null);
      if (!active) return;
      if (!customer) {
        markAccountSignedOut();
        setSignedOut(true);
        return;
      }
      markAccountSignedIn();
      const sessionId = getCartSessionId();
      try {
        const next = await getCart(sessionId);
        if (active) {
          setCart(next);
          writeAccountRouteCache<Cart>(accountRouteCacheKeys.cart, next);
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load cart.");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function changeQuantity(itemId: string, quantity: number) {
    if (!cart || quantity < 1) return;
    setBusyItemId(itemId);
    setError("");
    try {
      const nextCart = await updateCartItem(cart.sessionId, itemId, quantity);
      setCart(nextCart);
      writeAccountRouteCache<Cart>(accountRouteCacheKeys.cart, nextCart);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update cart.");
      try {
        const nextCart = await getCart(cart.sessionId);
        setCart(nextCart);
        writeAccountRouteCache<Cart>(accountRouteCacheKeys.cart, nextCart);
      } catch {
        // Keep the last cart snapshot if the recovery refresh also fails.
      }
    } finally {
      setBusyItemId(null);
    }
  }

  async function remove(itemId: string) {
    if (!cart) return;
    setBusyItemId(itemId);
    setError("");
    try {
      const nextCart = await removeCartItem(cart.sessionId, itemId);
      setCart(nextCart);
      writeAccountRouteCache<Cart>(accountRouteCacheKeys.cart, nextCart);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to remove item.");
    } finally {
      setBusyItemId(null);
    }
  }

  if (signedOut) {
    return (
      <section className="commerce-guest-card commerce-guest-card--cart">
        <div className="commerce-guest-card__content">
          <span className="commerce-guest-card__kicker">SHOPPING CART</span>
          <h1>Sign in to use your cart.</h1>
          <p>Your Elvane cart stays private and follows your account across devices.</p>
          <Link className="button button--primary" href="/account/sign-in?returnTo=%2Fcart">
            Sign in
          </Link>
        </div>
      </section>
    );
  }

  if (!cart && !error) {
    return (
      <section className="cart-state-card">
        <div className="loading-spinner" />
        <span>Loading your cart…</span>
      </section>
    );
  }

  if (!cart) {
    return (
      <section className="cart-state-card">
        <div className="cart-state-card__icon">!</div>
        <span className="section-kicker">CART UNAVAILABLE</span>
        <h2>We couldn&apos;t load your cart</h2>
        <p className="form-error">{error}</p>
      </section>
    );
  }

  if (cart.items.length === 0) {
    return (
      <section className="cart-state-card">
        <div className="cart-state-card__icon">BAG</div>
        <span className="section-kicker">YOUR BAG</span>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven&apos;t added anything yet. Explore the latest Elvane collection and find something you like.</p>
        <Link className="button button--primary" href="/#shop">
          Start shopping
        </Link>
      </section>
    );
  }

  const deliveryUnlocked = cart.subtotal >= 150;
  const delivery = deliveryUnlocked ? 0 : 10;
  const total = cart.subtotal + delivery;

  return (
    <>
      <section className={`cart-delivery-banner${deliveryUnlocked ? " cart-delivery-banner--unlocked" : ""}`}>
        <div className="cart-delivery-banner__copy">
          <span className="cart-delivery-banner__eyebrow">DELIVERY BENEFIT</span>
          <strong>{deliveryUnlocked ? "Free delivery unlocked" : `Spend RM ${(150 - cart.subtotal).toFixed(2)} more to unlock free delivery`}</strong>
          <span>{deliveryUnlocked ? "Your order qualifies for complimentary standard delivery." : "Every eligible item in this cart counts toward the RM150 threshold."}</span>
        </div>
        <div className="cart-delivery-meter" aria-label="Free delivery progress">
          <div className="cart-delivery-meter__track">
            <span style={{ width: `${Math.min((cart.subtotal / 150) * 100, 100)}%` }} />
          </div>
          <b>{deliveryUnlocked ? "RM150 reached" : `RM ${cart.subtotal.toFixed(2)} / RM150`}</b>
        </div>
      </section>

      <div className="cart-market-layout">
        <section className="cart-market-list">
          <header className="cart-list-heading cart-list-heading--card">
            <div>
              <span className="section-kicker">SHOPPING BAG</span>
              <strong>Items in your cart</strong>
            </div>
            <span>{cart.totalQuantity} item{cart.totalQuantity === 1 ? "" : "s"}</span>
          </header>

          <div className="cart-market-list__body">
            {cart.items.map((item) => {
              const busy = busyItemId === item.id;
              const lineTotal = item.price * item.quantity;

              return (
                <article className="cart-market-item" key={item.id}>
                  <Link href={`/products/${item.slug}`} className="cart-market-item__media" aria-label={item.productName}>
                    {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>{item.productName.slice(0, 1)}</span>}
                  </Link>

                  <div className="cart-market-item__info">
                    <div className="cart-market-item__topline">
                      <span className="cart-market-item__brand">ELVANE SELECT</span>
                      <button className="cart-remove-icon" type="button" disabled={busy} onClick={() => remove(item.id)} aria-label={`Remove ${item.productName}`}>
                        ×
                      </button>
                    </div>
                    <Link href={`/products/${item.slug}`}>
                      <h3>{item.productName}</h3>
                    </Link>
                    <span className="cart-market-item__variant">{item.variantName} · {item.sku}</span>

                    {item.issue ? (
                      <div className="cart-status-row cart-status-row--issue">{item.issue}</div>
                    ) : (
                      <div className="cart-status-row">
                        <span className="cart-status-row__dot" />
                        {item.availableStock <= 5 ? `Only ${item.availableStock} left` : `${item.availableStock} available`}
                      </div>
                    )}

                    {item.quantity > item.availableStock && item.availableStock > 0 && item.productActive && item.variantActive ? (
                      <button className="cart-adjust-link" type="button" disabled={busy} onClick={() => changeQuantity(item.id, item.availableStock)}>
                        Adjust quantity to {item.availableStock}
                      </button>
                    ) : null}

                    <div className="cart-market-item__actions">
                      <div className="quantity-stepper" aria-label={`Quantity for ${item.productName}`}>
                        <button type="button" disabled={busy || item.quantity <= 1} onClick={() => changeQuantity(item.id, item.quantity - 1)} aria-label="Decrease quantity">−</button>
                        <span>{item.quantity}</span>
                        <button type="button" disabled={busy || !item.productActive || !item.variantActive || !!item.issue || item.quantity >= item.availableStock || item.quantity >= 99} onClick={() => changeQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                      </div>
                      <button className="remove-link" type="button" disabled={busy} onClick={() => remove(item.id)}>Remove</button>
                    </div>
                  </div>

                  <div className="cart-market-item__pricing">
                    <span>RM {item.price.toFixed(2)} each</span>
                    <strong>RM {lineTotal.toFixed(2)}</strong>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="checkout-summary">
          <div className="checkout-summary__header">
            <div>
              <span className="section-kicker">ORDER SUMMARY</span>
              <h2>Ready to checkout</h2>
            </div>
            <span className="checkout-summary__count">{cart.totalQuantity}</span>
          </div>

          <div className="checkout-summary__rows">
            <div><span>Subtotal</span><strong>RM {cart.subtotal.toFixed(2)}</strong></div>
            <div><span>Delivery</span><strong>{deliveryUnlocked ? "Free" : "RM 10.00"}</strong></div>
          </div>

          <div className="checkout-summary__total">
            <span>Estimated total</span>
            <strong>RM {total.toFixed(2)}</strong>
          </div>

          {cart.canCheckout ? (
            <Link className="button button--checkout" href="/checkout">Proceed to checkout</Link>
          ) : (
            <button className="button button--checkout" type="button" disabled>Resolve cart issues to checkout</button>
          )}

          {cart.issueCount > 0 ? (
            <p className="cart-summary-warning">{cart.issueCount} item{cart.issueCount === 1 ? "" : "s"} need attention before checkout.</p>
          ) : null}

          <div className="checkout-benefits">
            <div><b>Secure checkout</b><span>Protected payment flow</span></div>
            <div><b>14-day returns</b><span>Eligible products can be returned</span></div>
            <div><b>Real-time stock</b><span>Inventory is checked before payment</span></div>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
        </aside>
      </div>
    </>
  );
}
