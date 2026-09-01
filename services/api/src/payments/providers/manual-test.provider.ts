import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  PaymentProviderAdapter,
  PaymentSessionRequest,
  PaymentSessionResult,
  PaymentSessionResumeResult,
  PaymentRefundRequest,
  PaymentRefundResult,
} from './payment-provider';

@Injectable()
export class ManualTestPaymentProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.MANUAL_TEST;

  constructor(private readonly configService: ConfigService) {}

  async createSession(
    request: PaymentSessionRequest,
  ): Promise<PaymentSessionResult> {
    if (
      this.configService.get<string>('NODE_ENV') === 'production'
    ) {
      throw new ForbiddenException(
        'Development payments are disabled in production.',
      );
    }

    return {
      provider: this.provider,
      providerRef: `DEV-${randomUUID()}`,
      checkoutUrl: null,
      metadata: {
        mode: 'development',
        orderNumber: request.orderNumber,
      },
    };
  }

  async resumeSession(): Promise<PaymentSessionResumeResult> {
    return { state: 'OPEN', checkoutUrl: null };
  }

  async cancelSession(): Promise<void> {
    return;
  }

  async refund(
    _request: PaymentRefundRequest,
  ): Promise<PaymentRefundResult> {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException(
        'Development refunds are disabled in production.',
      );
    }

    return {
      providerRef: `DEV-REFUND-${randomUUID()}`,
      state: 'REFUNDED',
    };
  }
}
