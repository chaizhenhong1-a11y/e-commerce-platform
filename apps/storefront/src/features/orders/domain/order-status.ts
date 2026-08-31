export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "FULFILLED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type PublicOrderStatus = {
  orderNumber: string;
  email: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  shippingMethod: "STANDARD";
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  reservationExpiresAt: string | null;
  createdAt: string;
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
  }>;
};
