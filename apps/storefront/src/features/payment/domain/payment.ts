export type PaymentProvider = "MANUAL_TEST" | "STRIPE" | "BILLPLZ";

export type Payment = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  amountCents: number;
  currency: string;
  providerRef: string | null;
  checkoutUrl: string | null;
  resumed?: boolean;
};
