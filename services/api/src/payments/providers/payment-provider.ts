import { PaymentProvider } from '@prisma/client';

export type PaymentSessionRequest = {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  customerEmail: string;
  customerName: string;
};

export type PaymentSessionResult = {
  provider: PaymentProvider;
  providerRef: string;
  checkoutUrl: string | null;
  reservationExpiresAt?: Date;
  metadata?: Record<string, unknown>;
};

export type PaymentSessionResumeResult = {
  state: 'OPEN' | 'PAID' | 'EXPIRED' | 'PROCESSING';
  checkoutUrl: string | null;
};

export type PaymentRefundRequest = {
  refundId: string;
  paymentProviderRef: string;
  amountCents: number;
  currency: string;
};

export type PaymentRefundResult = {
  providerRef: string;
  state: 'PROCESSING' | 'REFUNDED';
};

export interface PaymentProviderAdapter {
  readonly provider: PaymentProvider;

  createSession(
    request: PaymentSessionRequest,
  ): Promise<PaymentSessionResult>;

  resumeSession(
    providerRef: string,
  ): Promise<PaymentSessionResumeResult>;

  cancelSession(providerRef: string): Promise<void>;

  refund(request: PaymentRefundRequest): Promise<PaymentRefundResult>;
}
