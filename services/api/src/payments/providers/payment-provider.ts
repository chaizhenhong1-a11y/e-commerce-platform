import { PaymentProvider } from '@prisma/client';

export type PaymentSessionRequest = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
};

export type PaymentSessionResult = {
  provider: PaymentProvider;
  providerRef: string;
  checkoutUrl: string | null;
  reservationExpiresAt?: Date;
  metadata?: Record<string, unknown>;
};

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;

  createSession(
    request: PaymentSessionRequest,
  ): Promise<PaymentSessionResult>;

  resumeSession(providerRef: string): Promise<string | null>;
}
