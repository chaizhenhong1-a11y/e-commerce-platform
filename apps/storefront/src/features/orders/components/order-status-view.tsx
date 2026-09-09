import Link from "next/link";
import { CancelOrderButton } from "./cancel-order-button";
import { RefundRequestButton } from "./refund-request-button";
import { ReturnRequestButton } from "./return-request-button";
import { StripePaymentLaunchButton } from "@/features/payment/components/stripe-payment-launch-button";
import type {
  OrderStatus,
  PublicOrderStatus,
} from "../domain/order-status";

const labels: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
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
      { key: "created", label: "Order created", description: "Your order was received by TextShop.", state: "complete" },
      { key: "cancelled", label: "Order cancelled", description: "This order will not continue to fulfilment.", state: "stopped" },
    ];
  }
  if (order.status === "EXPIRED") {
    return [
      { key: "created", label: "Order created", description: "Inventory was reserved while payment was pending.", state: "complete" },
      { key: "expired", label: "Reservation expired", description: "Payment was not completed within the reservation window and inventory was released.", state: "stopped" },
    ];
  }

  const rank: Record<OrderStatus, number> = {
    AWAITING_PAYMENT: 0,
    CONFIRMED: 1,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    FULFILLED: 4,
    CANCELLED: -1,
    EXPIRED: -1,
  };
  const current = rank[order.status];
  const stateFor = (step: number): TimelineStep["state"] =>
    current > step ? "complete" : current === step ? "current" : "pending";

  return [
    { key: "created", label: "Order created", description: "Your order was received by TextShop.", state: "complete" },
    { key: "payment", label: "Payment confirmed", description: "Payment has been accepted and the order is confirmed.", state: stateFor(1) },
    { key: "processing", label: "Processing", description: "Your order is being prepared for dispatch.", state: stateFor(2) },
    { key: "shipped", label: "Shipped", description: "The parcel has left the warehouse and tracking is available when provided.", state: stateFor(3) },
    { key: "delivered", label: "Delivered", description: "The parcel has been marked as delivered.", state: current >= 4 ? "complete" : "pending" },
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

export function OrderStatusView({
  order,
  suppressPaymentActions = false,
}: {
  order: PublicOrderStatus;
  suppressPaymentActions?: boolean;
}) {
  const paid =
    order.paymentStatus === "PAID" ||
    order.paymentStatus === "PARTIALLY_REFUNDED";
  const refunded = order.paymentStatus === "REFUNDED";
  const expired = order.status === "EXPIRED";
  const timeline = buildTimeline(order);
  const canRefund =
    order.paymentStatus === "PAID" &&
    order.status === "CONFIRMED" &&
    !order.refund;
  const refundPending =
    order.refund?.status === "REQUESTED" ||
    order.refund?.status === "PROCESSING";
  const returnAllowsRetry =
    !order.returnRequest ||
    ["REJECTED", "CANCELLED", "COMPLETED"].includes(order.returnRequest.status);
  const canReturn =
    (order.paymentStatus === "PAID" ||
      order.paymentStatus === "PARTIALLY_REFUNDED") &&
    ["DELIVERED", "FULFILLED"].includes(order.status) &&
    returnAllowsRetry;

  return (
    <div className="order-detail-layout">
      <section className="order-status-card order-status-card--detail">
        <div
          className={`order-status-card__icon ${
            (paid || refunded) ? "is-success" : expired ? "is-expired" : ""
          }`}
        >
          {paid || refunded ? "✓" : expired ? "!" : "…"}
        </div>

        <span className="section-kicker">ORDER DETAILS</span>
        <h1>{labels[order.status]}</h1>
        <p>
          {refunded
            ? "The order payment has been refunded to the original payment method."
            : paid
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
            <strong>
              {order.paymentStatus === "PENDING"
                ? "Awaiting payment"
                : order.paymentStatus === "PAID"
                  ? "Payment received"
                  : order.paymentStatus === "PARTIALLY_REFUNDED"
                    ? "Partially refunded"
                    : order.paymentStatus === "REFUNDED"
                      ? "Refunded"
                      : "Payment failed"}
            </strong>
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
          {order.status === "AWAITING_PAYMENT" && !suppressPaymentActions ? (
            <>
              <StripePaymentLaunchButton orderNumber={order.orderNumber} />
              <CancelOrderButton orderNumber={order.orderNumber} />
            </>
          ) : null}
          {canRefund ? <RefundRequestButton orderNumber={order.orderNumber} /> : null}
          {canReturn ? (
            <ReturnRequestButton
              orderNumber={order.orderNumber}
              items={order.items}
            />
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
            {order.discountCents > 0 ? (
              <div className="order-detail-totals__discount">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>− {money(order.discountCents)}</span>
              </div>
            ) : null}
            <div className="order-detail-totals__grand">
              <strong>Total</strong>
              <strong>{money(order.totalCents)}</strong>
            </div>
          </div>
        </section>

        {order.fulfillment.trackingNumber || order.status === "PROCESSING" || order.status === "SHIPPED" || order.status === "DELIVERED" ? (
          <section className="order-detail-panel">
            <span className="section-kicker">DELIVERY</span>
            <h2>{order.status === "DELIVERED" || order.status === "FULFILLED" ? "Delivered" : order.status === "SHIPPED" ? "On the way" : "Preparing shipment"}</h2>
            <div className="order-detail-meta">
              {order.fulfillment.courierName ? <div><span>Courier</span><strong>{order.fulfillment.courierName}</strong></div> : null}
              {order.fulfillment.trackingNumber ? <div><span>Tracking number</span><strong>{order.fulfillment.trackingNumber}</strong></div> : null}
              {order.fulfillment.shippedAt ? <div><span>Shipped</span><strong>{formatDate(order.fulfillment.shippedAt)}</strong></div> : null}
              {order.fulfillment.deliveredAt ? <div><span>Delivered</span><strong>{formatDate(order.fulfillment.deliveredAt)}</strong></div> : null}
            </div>
            {order.fulfillment.trackingUrl ? (
              <a className="button" href={order.fulfillment.trackingUrl} target="_blank" rel="noreferrer">Track parcel</a>
            ) : null}
          </section>
        ) : null}

        {order.refund ? (
          <section className="order-detail-panel">
            <span className="section-kicker">REFUND</span>
            <h2>
              {order.refund.status === "REFUNDED"
                ? "Refund completed"
                : refundPending
                  ? "Refund in progress"
                  : order.refund.status === "REJECTED"
                    ? "Refund not approved"
                    : "Refund needs attention"}
            </h2>
            <div className="order-detail-meta">
              <div><span>Status</span><strong>{order.refund.status}</strong></div>
              <div><span>Amount</span><strong>{money(order.refund.amountCents)}</strong></div>
            </div>
            <p>
              {order.refund.status === "REQUESTED"
                ? "Your refund request has been recorded. Do not submit another refund action while it is pending."
                : order.refund.status === "PROCESSING"
                  ? "The refund is being processed through the original payment provider."
                  : order.refund.status === "REFUNDED"
                    ? "The refund has been completed. Bank posting times may still vary."
                    : order.refund.status === "REJECTED"
                      ? "This refund request was not approved. Contact support if you need help."
                      : "The refund could not be completed. Contact support before trying another action."}
            </p>
          </section>
        ) : null}

        {order.returnRequest ? (
          <section className="order-detail-panel">
            <span className="section-kicker">RETURN</span>
            <h2>Return status</h2>
            <div className="order-detail-meta">
              <div><span>Status</span><strong>{order.returnRequest.status}</strong></div>
              <div><span>Reason</span><strong>{order.returnRequest.reason}</strong></div>
            </div>
            <div className="order-status-items order-status-items--detail">
              {order.returnRequest.items.map((item) => (
                <div key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>{item.variantName} · {item.sku} · Qty {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
            <p>Refund and restocking are separate steps. Stock is never restored merely because a return was requested.</p>
          </section>
        ) : null}

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
