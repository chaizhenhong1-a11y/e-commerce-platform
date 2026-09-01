export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "FULFILLED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED";

export type PublicOrderStatus = {
  orderNumber: string;
  email: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  shippingMethod: "STANDARD";
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  couponCode: string | null;
  couponName: string | null;
  totalCents: number;
  reservationExpiresAt: string | null;
  createdAt: string;
  fulfillment: {
    courierName: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    processingAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
  };
  shipping: {
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postcode: string;
    countryCode: string;
  };
  refund: {
    id: string;
    status: "REQUESTED" | "PROCESSING" | "REFUNDED" | "REJECTED" | "FAILED";
    reason: string;
    amountCents: number;
    requestedAt: string;
    processedAt: string | null;
  } | null;
  returnRequest: {
    id: string;
    status: "REQUESTED" | "APPROVED" | "IN_TRANSIT" | "RECEIVED" | "REJECTED" | "CANCELLED" | "COMPLETED";
    reason: "DAMAGED" | "DEFECTIVE" | "WRONG_ITEM" | "NOT_AS_DESCRIBED" | "CHANGED_MIND" | "OTHER";
    customerNote: string | null;
    requestedAt: string;
    approvedAt: string | null;
    receivedAt: string | null;
    completedAt: string | null;
    staffNote: string | null;
    items: Array<{
      id: string;
      orderItemId: string;
      quantity: number;
      condition: "UNOPENED" | "OPENED" | "DAMAGED" | "DEFECTIVE" | null;
      disposition: "RESTOCK" | "QUARANTINE" | "DISCARD" | null;
      inspectedAt: string | null;
      restockedAt: string | null;
      productName: string;
      variantName: string;
      sku: string;
    }>;
  } | null;
  payment: {
    id: string;
    provider: string;
    status: string;
  } | null;
  items: Array<{
    id: string;
    sku: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    discountCents: number;
  }>;
};
