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
  couponCode?: string;
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
  discountCents: number;
};

export type CheckoutOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  couponCode: string | null;
  couponName: string | null;
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

export type CouponValidation = {
  id: string;
  code: string;
  name: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  discountCents: number;
  eligibleSubtotalCents: number;
  minSubtotalCents: number;
  maxDiscountCents: number | null;
};

export type AutomaticPromotionPreview = {
  id: string;
  name: string;
  discountCents: number;
};
