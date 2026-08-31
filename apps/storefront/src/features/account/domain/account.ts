export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  emailVerified: boolean;
};

export type CustomerOrder = {
  orderNumber: string;
  status:
    | "AWAITING_PAYMENT"
    | "CONFIRMED"
    | "FULFILLED"
    | "CANCELLED"
    | "EXPIRED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  shippingMethod: "STANDARD";
  shipping: {
    city: string;
    state: string;
    postcode: string;
    countryCode: string;
  };
  reservationExpiresAt: string | null;
  createdAt: string;
  itemCount: number;
  items: Array<{
    id: string;
    variantId: string;
    sku: string;
    productName: string;
    productSlug: string | null;
    imageUrl: string | null;
    variantName: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};

export type CustomerAddress = {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postcode: string;
  countryCode: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAddressInput = {
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postcode: string;
  countryCode?: "MY";
  isDefault?: boolean;
};
