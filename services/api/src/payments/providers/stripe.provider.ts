import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentProvider } from '@prisma/client';
import Stripe from 'stripe';
import {
  PaymentProviderAdapter,
  PaymentSessionRequest,
  PaymentSessionResult,
  PaymentSessionResumeResult,
  PaymentRefundRequest,
  PaymentRefundResult,
} from './payment-provider';

@Injectable()
export class StripePaymentProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.STRIPE;

  constructor(private readonly configService: ConfigService) {}

  async createSession(
    request: PaymentSessionRequest,
  ): Promise<PaymentSessionResult> {
    const stripe = this.getClient();
    const returnBaseUrl = this.resolveReturnBaseUrl(request.returnBaseUrl);

    const reservationExpiresAt = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      expires_at: Math.floor(
        reservationExpiresAt.getTime() / 1000,
      ),
      customer_email: request.customerEmail,
      client_reference_id: request.paymentId,
      metadata: {
        paymentId: request.paymentId,
        orderId: request.orderId,
        orderNumber: request.orderNumber,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: request.currency.toLowerCase(),
            unit_amount: request.amountCents,
            product_data: {
              name: `TextShop order ${request.orderNumber}`,
            },
          },
        },
      ],
      success_url: this.buildReturnUrl(
        returnBaseUrl,
        request.orderNumber,
        'success',
      ),
      cancel_url: this.buildReturnUrl(
        returnBaseUrl,
        request.orderNumber,
        'cancelled',
      ),
    });

    if (!session.url) {
      throw new ServiceUnavailableException(
        'Stripe did not return a checkout URL.',
      );
    }

    return {
      provider: this.provider,
      providerRef: session.id,
      checkoutUrl: session.url,
      reservationExpiresAt,
      metadata: {
        stripeSessionId: session.id,
      },
    };
  }

  private buildReturnUrl(
    returnBaseUrl: string,
    orderNumber: string,
    status: 'success' | 'cancelled',
  ) {
    const url = new URL('/payment-return.html', returnBaseUrl);
    url.searchParams.set('orderNumber', orderNumber);
    url.searchParams.set('payment', status);
    return url.toString();
  }

  private resolveReturnBaseUrl(requested?: string) {
    const storefrontUrl =
      this.configService.get<string>('STOREFRONT_URL') ??
      'http://localhost:3000';
    const fallback = new URL(storefrontUrl);

    if (!requested?.trim()) {
      return fallback.origin;
    }

    let candidate: URL;
    try {
      candidate = new URL(requested.trim());
    } catch {
      throw new BadRequestException('Payment return URL is invalid.');
    }

    if (!['http:', 'https:'].includes(candidate.protocol)) {
      throw new BadRequestException('Payment return URL must use HTTP or HTTPS.');
    }

    const nodeEnv =
      this.configService.get<string>('NODE_ENV') ?? 'development';
    const isLocalDevelopmentOrigin =
      nodeEnv !== 'production' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(candidate.hostname);
    const isConfiguredStorefrontOrigin = candidate.origin === fallback.origin;

    if (!isLocalDevelopmentOrigin && !isConfiguredStorefrontOrigin) {
      throw new BadRequestException('Payment return URL origin is not allowed.');
    }

    return candidate.origin;
  }

  async resumeSession(
    providerRef: string,
  ): Promise<PaymentSessionResumeResult> {
    const session = await this.getClient().checkout.sessions.retrieve(
      providerRef,
    );

    if (session.payment_status === 'paid') {
      return { state: 'PAID', checkoutUrl: null };
    }

    if (session.status === 'expired') {
      return { state: 'EXPIRED', checkoutUrl: null };
    }

    if (session.status === 'open') {
      return {
        state: 'OPEN',
        checkoutUrl: session.url ?? null,
      };
    }

    return { state: 'PROCESSING', checkoutUrl: null };
  }

  async cancelSession(providerRef: string): Promise<void> {
    const stripe = this.getClient();
    const session = await stripe.checkout.sessions.retrieve(providerRef);

    if (session.status === 'open') {
      await stripe.checkout.sessions.expire(providerRef);
    }
  }

  async refund(
    request: PaymentRefundRequest,
  ): Promise<PaymentRefundResult> {
    const stripe = this.getClient();
    const session = await stripe.checkout.sessions.retrieve(
      request.paymentProviderRef,
    );
    const paymentIntent = session.payment_intent;
    const paymentIntentId =
      typeof paymentIntent === 'string'
        ? paymentIntent
        : paymentIntent?.id;

    if (!paymentIntentId) {
      throw new ServiceUnavailableException(
        'Stripe payment intent is unavailable for this order.',
      );
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: request.amountCents,
      metadata: { refundId: request.refundId },
    });

    return {
      providerRef: refund.id,
      state: refund.status === 'succeeded' ? 'REFUNDED' : 'PROCESSING',
    };
  }

  getWebhookClient(): Stripe {
    return this.getClient();
  }

  getWebhookSecret(): string {
    const secret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!secret) {
      throw new ServiceUnavailableException(
        'STRIPE_WEBHOOK_SECRET is not configured.',
      );
    }

    return secret;
  }

  private getClient(): Stripe {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new ServiceUnavailableException(
        'Stripe is not configured. Set STRIPE_SECRET_KEY or use MANUAL_TEST.',
      );
    }

    return new Stripe(secretKey);
  }
}
