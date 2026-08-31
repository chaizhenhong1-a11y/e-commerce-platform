"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getCurrentCustomer,
  getCustomerOrders,
} from "@/features/account/data/account-api";
import type { CustomerOrder } from "@/features/account/domain/account";
import { CancelOrderButton } from "./cancel-order-button";

type OrderFilter =
  | "ALL"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "FULFILLED"
  | "CANCELLED"
  | "EXPIRED";

const filters: Array<{ value: OrderFilter; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "AWAITING_PAYMENT", label: "Awaiting payment" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

const statusLabels: Record<CustomerOrder["status"], string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

function money(cents: number) {
  return `RM ${(cents / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrdersCenter() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [filter, setFilter] = useState<OrderFilter>("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load({ silent = false } = {}) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const customer = await getCurrentCustomer();
      if (!customer) {
        window.location.assign("/account/sign-in");
        return;
      }

      setOrders(await getCustomerOrders());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load your orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return orders.filter((order) => {
      if (filter !== "ALL" && order.status !== filter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        order.orderNumber.toLocaleLowerCase().includes(normalizedQuery) ||
        order.items.some((item) =>
          [
            item.productName,
            item.variantName,
            item.sku,
          ].some((value) =>
            value.toLocaleLowerCase().includes(normalizedQuery),
          ),
        )
      );
    });
  }, [filter, orders, query]);

  if (loading) {
    return (
      <section className="orders-center shell">
        <div className="orders-center__header">
          <div>
            <span className="section-kicker">PURCHASES</span>
            <h1>My orders</h1>
          </div>
        </div>
        <div className="orders-center-loading">Loading your purchases…</div>
      </section>
    );
  }

  return (
    <section className="orders-center shell">
      <div className="orders-center__header">
        <div>
          <span className="section-kicker">PURCHASES</span>
          <h1>My orders</h1>
          <p>
            Track payment, delivery progress and every product bought with
            your account.
          </p>
        </div>
        <button
          className="button"
          type="button"
          disabled={refreshing}
          onClick={() => void load({ silent: true })}
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div className="orders-center-toolbar">
        <label className="orders-center-search">
          <span>Search purchases</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Order number, product or SKU"
          />
        </label>

        <div className="orders-filter-tabs" aria-label="Order status filters">
          {filters.map((item) => (
            <button
              className={filter === item.value ? "is-active" : ""}
              type="button"
              key={item.value}
              onClick={() => setFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="orders-center-error">
          <strong>Unable to load purchases</strong>
          <p>{error}</p>
          <button className="button" type="button" onClick={() => void load()}>
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-center-empty">
          <strong>No account purchases yet</strong>
          <p>
            Orders placed while signed in will appear here with their products,
            payment status and delivery progress.
          </p>
          <Link className="button button--primary" href="/#shop">
            Start shopping
          </Link>
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="orders-center-empty">
          <strong>No matching orders</strong>
          <p>Try another order number, product, SKU or status filter.</p>
          <button
            className="button"
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("ALL");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="orders-center-list">
          {visibleOrders.map((order) => (
            <article className="order-center-card" key={order.orderNumber}>
              <header className="order-center-card__header">
                <div>
                  <span className="order-center-card__number">
                    {order.orderNumber}
                  </span>
                  <small>{formatDate(order.createdAt)}</small>
                </div>
                <div className="order-center-statuses">
                  <span
                    className={`order-status-pill order-status-pill--${order.status.toLocaleLowerCase()}`}
                  >
                    {statusLabels[order.status]}
                  </span>
                  <span className="order-payment-pill">
                    Payment: {order.paymentStatus}
                  </span>
                </div>
              </header>

              <div className="order-center-items">
                {order.items.map((item) => (
                  <div className="order-center-item" key={item.id}>
                    <div className="order-center-item__media">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.productName}
                          fill
                          sizes="84px"
                        />
                      ) : (
                        <span aria-hidden="true">T</span>
                      )}
                    </div>

                    <div className="order-center-item__copy">
                      {item.productSlug ? (
                        <Link
                          href={`/products/${encodeURIComponent(item.productSlug)}`}
                        >
                          {item.productName}
                        </Link>
                      ) : (
                        <strong>{item.productName}</strong>
                      )}
                      <span>{item.variantName}</span>
                      <small>SKU {item.sku} · Qty {item.quantity}</small>
                    </div>

                    <div className="order-center-item__price">
                      <strong>{money(item.lineTotalCents)}</strong>
                      <small>{money(item.unitPriceCents)} each</small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-center-card__summary">
                <div>
                  <span>Delivery</span>
                  <strong>Standard delivery</strong>
                  <small>
                    {order.shipping.postcode} {order.shipping.city},{" "}
                    {order.shipping.state}
                  </small>
                </div>
                <div>
                  <span>Items</span>
                  <strong>{order.itemCount}</strong>
                </div>
                <div className="order-center-card__total">
                  <span>Order total</span>
                  <strong>{money(order.totalCents)}</strong>
                  <small>
                    {order.shippingCents === 0
                      ? "Free shipping"
                      : `${money(order.shippingCents)} shipping`}
                  </small>
                </div>
              </div>

              <footer className="order-center-card__actions">
                <Link
                  className="button"
                  href={`/orders/${encodeURIComponent(order.orderNumber)}`}
                >
                  View details
                </Link>

                {order.status === "AWAITING_PAYMENT" &&
                order.paymentStatus === "PENDING" ? (
                  <>
                    <Link
                      className="button button--primary"
                      href={`/payment?order=${encodeURIComponent(order.orderNumber)}`}
                    >
                      Continue payment
                    </Link>
                    <CancelOrderButton
                      orderNumber={order.orderNumber}
                      onCancelled={() => load({ silent: true })}
                    />
                  </>
                ) : null}
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
