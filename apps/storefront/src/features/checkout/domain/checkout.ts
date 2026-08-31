export type CheckoutPayload = {
  sessionId: string;
  email: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postcode: string;
  countryCode: "MY";
  shippingMethod: "STANDARD";
};

export type CheckoutOrderItem = {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type CheckoutOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  reservationExpiresAt: string | null;
  email: string;
  shipping: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postcode: string;
    countryCode: string;
  };
  items: CheckoutOrderItem[];
};
