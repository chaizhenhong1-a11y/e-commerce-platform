import {
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
} from './payment-provider';

@Injectable()
export class StripePaymentProvider implements PaymentProviderAdapter {
  readonly provider = PaymentProvider.STRIPE;

  constructor(private readonly configService: ConfigService) {}

  async createSession(
    request: PaymentSessionRequest,
  ): Promise<PaymentSessionResult> {
    const stripe = this.getClient();
    const storefrontUrl =
      this.configService.get<string>('STOREFRONT_URL') ??
      'http://localhost:3000';

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
      success_url: `${storefrontUrl}/orders/${encodeURIComponent(
        request.orderNumber,
      )}?payment=success`,
      cancel_url: `${storefrontUrl}/orders/${encodeURIComponent(
        request.orderNumber,
      )}?payment=cancelled`,
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

  async resumeSession(providerRef: string): Promise<string | null> {
    const session = await this.getClient().checkout.sessions.retrieve(
      providerRef,
    );

    return session.url ?? null;
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
