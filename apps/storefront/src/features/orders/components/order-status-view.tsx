import Link from "next/link";
import { CancelOrderButton } from "./cancel-order-button";
import type {
  OrderStatus,
  PublicOrderStatus,
} from "../domain/order-status";

const labels: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  FULFILLED: "Fulfilled",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

type TimelineStep = {
  key: string;
  label: string;
  description: string;
  state: "complete" | "current" | "pending" | "stopped";
};

function buildTimeline(order: PublicOrderStatus): TimelineStep[] {
  if (order.status === "CANCELLED") {
    return [
      {
        key: "created",
        label: "Order created",
        description: "Your order was received by TextShop.",
        state: "complete",
      },
      {
        key: "cancelled",
        label: "Order cancelled",
        description: "This order will not continue to fulfilment.",
        state: "stopped",
      },
    ];
  }

  if (order.status === "EXPIRED") {
    return [
      {
        key: "created",
        label: "Order created",
        description: "Inventory was reserved while payment was pending.",
        state: "complete",
      },
      {
        key: "expired",
        label: "Reservation expired",
        description:
          "Payment was not completed within the reservation window and inventory was released.",
        state: "stopped",
      },
    ];
  }

  return [
    {
      key: "created",
      label: "Order created",
      description: "Your order was received by TextShop.",
      state: "complete",
    },
    {
      key: "payment",
      label: "Payment confirmed",
      description: "Payment has been accepted and the order is confirmed.",
      state:
        order.status === "AWAITING_PAYMENT"
          ? "current"
          : "complete",
    },
    {
      key: "fulfilment",
      label: "Fulfilled",
      description: "The order has completed fulfilment.",
      state:
        order.status === "FULFILLED"
          ? "complete"
          : order.status === "CONFIRMED"
            ? "current"
            : "pending",
    },
  ];
}

function money(cents: number) {
  return `RM ${(cents / 100).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrderStatusView({ order }: { order: PublicOrderStatus }) {
  const paid = order.paymentStatus === "PAID";
  const expired = order.status === "EXPIRED";
  const timeline = buildTimeline(order);

  return (
    <div className="order-detail-layout">
      <section className="order-status-card order-status-card--detail">
        <div
          className={`order-status-card__icon ${
            paid ? "is-success" : expired ? "is-expired" : ""
          }`}
        >
          {paid ? "✓" : expired ? "!" : "…"}
        </div>

        <span className="section-kicker">ORDER DETAILS</span>
        <h1>{labels[order.status]}</h1>
        <p>
          {paid
            ? "Payment is complete. You can follow the order lifecycle below."
            : expired
              ? "This unpaid order expired and its reserved inventory was released."
              : "Your order is waiting for payment before it can be confirmed."}
        </p>

        <div className="order-status-card__number">
          <span>Order number</span>
          <strong>{order.orderNumber}</strong>
        </div>

        <div className="order-status-card__grid">
          <div>
            <span>Placed</span>
            <strong>{formatDate(order.createdAt)}</strong>
          </div>
          <div>
            <span>Payment</span>
            <strong>{order.paymentStatus}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{money(order.totalCents)}</strong>
          </div>
        </div>

        <div className="order-timeline">
          {timeline.map((step) => (
            <div
              className={`order-timeline__step is-${step.state}`}
              key={step.key}
            >
              <span className="order-timeline__marker" />
              <div>
                <strong>{step.label}</strong>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="order-status-card__actions">
          {order.status === "AWAITING_PAYMENT" ? (
            <>
              <Link
                className="button button--primary"
                href={`/payment?order=${encodeURIComponent(order.orderNumber)}`}
              >
                Continue payment
              </Link>
              <CancelOrderButton orderNumber={order.orderNumber} />
            </>
          ) : null}
          <Link className="button" href="/#shop">
            Continue shopping
          </Link>
        </div>
      </section>

      <aside className="order-detail-sidebar">
        <section className="order-detail-panel">
          <span className="section-kicker">ITEMS</span>
          <h2>Order summary</h2>

          <div className="order-status-items order-status-items--detail">
            {order.items.map((item) => (
              <div key={item.id}>
                <div>
                  <strong>{item.productName}</strong>
                  <span>
                    {item.variantName} · {item.sku} · Qty {item.quantity}
                  </span>
                  <small>{money(item.unitPriceCents)} each</small>
                </div>
                <strong>{money(item.lineTotalCents)}</strong>
              </div>
            ))}
          </div>

          <div className="order-detail-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(order.subtotalCents)}</span>
            </div>
            <div>
              <span>Shipping</span>
              <span>
                {order.shippingCents === 0
                  ? "Free"
                  : money(order.shippingCents)}
              </span>
            </div>
            <div className="order-detail-totals__grand">
              <strong>Total</strong>
              <strong>{money(order.totalCents)}</strong>
            </div>
          </div>
        </section>

        <section className="order-detail-panel">
          <span className="section-kicker">DELIVERY</span>
          <h2>Shipping details</h2>
          <address className="order-shipping-address">
            <strong>{order.shipping.fullName}</strong>
            <span>{order.shipping.phone}</span>
            <span>{order.shipping.line1}</span>
            {order.shipping.line2 ? <span>{order.shipping.line2}</span> : null}
            <span>
              {order.shipping.postcode} {order.shipping.city},{" "}
              {order.shipping.state}
            </span>
            <span>{order.shipping.countryCode}</span>
          </address>

          <div className="order-detail-meta">
            <div>
              <span>Delivery method</span>
              <strong>Standard delivery</strong>
            </div>
            <div>
              <span>Contact email</span>
              <strong>{order.email}</strong>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
