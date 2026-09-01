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

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const customer = await getCurrentCustomer().catch(() => null);
      if (!active) return;
      if (!customer) {
        setSignedOut(true);
        return;
      }
      const sessionId = getCartSessionId();
      try {
        const next = await getCart(sessionId);
        if (active) setCart(next);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load cart.");
      }
    })();
    return () => { active = false; };
  }, []);

  async function changeQuantity(itemId: string, quantity: number) {
    if (!cart || quantity < 1) return;

    setBusyItemId(itemId);
    setError("");

    try {
      setCart(await updateCartItem(cart.sessionId, itemId, quantity));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to update cart.",
      );
    } finally {
      setBusyItemId(null);
    }
  }

  async function remove(itemId: string) {
    if (!cart) return;

    setBusyItemId(itemId);
    setError("");

    try {
      setCart(await removeCartItem(cart.sessionId, itemId));
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to remove item.",
      );
    } finally {
      setBusyItemId(null);
    }
  }

  if (signedOut) {
    return (
      <div className="empty-cart-card">
        <span className="empty-cart-card__icon">🔒</span>
        <h2>Sign in to use your cart</h2>
        <p>Your cart belongs to your TextShop account and stays private across devices.</p>
        <Link className="button button--primary" href="/account/sign-in?returnTo=%2Fcart">Sign in</Link>
      </div>
    );
  }

  if (!cart && !error) {
    return (
      <div className="cart-loading-card">
        <div className="loading-spinner" />
        <span>Loading your cart…</span>
      </div>
    );
  }

  if (!cart) {
    return (
      <div className="empty-cart-card">
        <span className="empty-cart-card__icon">!</span>
        <h2>We couldn&apos;t load your cart.</h2>
        <p className="form-error">{error}</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="empty-cart-card">
        <span className="empty-cart-card__icon">🛒</span>
        <h2>Your cart is empty</h2>
        <p>
          Looks like you haven&apos;t added anything yet. Explore our latest
          products and find something you like.
        </p>
        <Link className="button button--primary" href="/#shop">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="cart-progress">
        <strong>
          {cart.subtotal >= 150
            ? "You unlocked free delivery"
            : `Add RM ${(150 - cart.subtotal).toFixed(2)} more for free delivery`}
        </strong>
        <div className="cart-progress__track">
          <span
            style={{
              width: `${Math.min((cart.subtotal / 150) * 100, 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="cart-market-layout">
        <div className="cart-market-list">
          <div className="cart-list-heading">
            <strong>Items</strong>
            <span>{cart.totalQuantity} in your cart</span>
          </div>

          {cart.items.map((item) => {
            const busy = busyItemId === item.id;

            return (
              <article className="cart-market-item" key={item.id}>
                <Link
                  href={`/products/${item.slug}`}
                  className="cart-market-item__media"
                  aria-label={item.productName}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" />
                  ) : (
                    <span>{item.productName.slice(0, 1)}</span>
                  )}
                </Link>

                <div className="cart-market-item__info">
                  <span className="cart-market-item__brand">TEXTSHOP SELECT</span>
                  <Link href={`/products/${item.slug}`}>
                    <h3>{item.productName}</h3>
                  </Link>
                  <span className="cart-market-item__variant">
                    {item.variantName} · {item.sku}
                  </span>
                  {item.issue ? (
                    <span className="cart-item-issue">{item.issue}</span>
                  ) : (
                    <span className="cart-item-stock">
                      {item.availableStock} available
                    </span>
                  )}
                  <strong className="cart-market-item__price">
                    RM {item.price.toFixed(2)}
                  </strong>

                  <div className="cart-market-item__footer">
                    <div className="quantity-stepper">
                      <button
                        type="button"
                        disabled={busy || item.quantity <= 1}
                        onClick={() => changeQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        disabled={
                          busy ||
                          !!item.issue ||
                          item.quantity >= item.availableStock ||
                          item.quantity >= 99
                        }
                        onClick={() => changeQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="remove-link"
                      type="button"
                      disabled={busy}
                      onClick={() => remove(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <strong className="cart-market-item__total">
                  RM {(item.price * item.quantity).toFixed(2)}
                </strong>
              </article>
            );
          })}
        </div>

        <aside className="checkout-summary">
          <span className="section-kicker">ORDER SUMMARY</span>
          <h2>Summary</h2>

          <div className="checkout-summary__rows">
            <div>
              <span>Subtotal</span>
              <span>RM {cart.subtotal.toFixed(2)}</span>
            </div>
            <div>
              <span>Delivery</span>
              <span>{cart.subtotal >= 150 ? "Free" : "RM 10.00"}</span>
            </div>
          </div>

          <div className="checkout-summary__total">
            <span>Estimated total</span>
            <strong>
              RM {(cart.subtotal + (cart.subtotal >= 150 ? 0 : 10)).toFixed(2)}
            </strong>
          </div>

          {cart.canCheckout ? (
            <Link className="button button--checkout" href="/checkout">
              Proceed to checkout
            </Link>
          ) : (
            <button className="button button--checkout" type="button" disabled>
              Resolve cart issues to checkout
            </button>
          )}

          {cart.issueCount > 0 ? (
            <p className="cart-summary-warning">
              {cart.issueCount} item{cart.issueCount === 1 ? "" : "s"} need
              attention before checkout.
            </p>
          ) : null}

          <div className="checkout-trust">
            <span>🔒 Secure checkout</span>
            <span>↩ 14-day returns</span>
          </div>

          {error ? <p className="form-error">{error}</p> : null}
        </aside>
      </div>
    </>
  );
}
