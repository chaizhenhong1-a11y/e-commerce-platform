export type PaymentProvider = "MANUAL_TEST" | "STRIPE" | "BILLPLZ";

export type Payment = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: "PENDING" | "PAID" | "FAILED" | "PARTIALLY_REFUNDED" | "REFUNDED";
  amountCents: number;
  currency: string;
  providerRef: string | null;
  checkoutUrl: string | null;
  resumed?: boolean;
};

export type PaymentReconciliation = {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: Payment["status"];
  payment: Payment | null;
  state: "CONFIRMED" | "PROCESSING" | "UNPAID" | "EXPIRED" | "TERMINAL";
};
