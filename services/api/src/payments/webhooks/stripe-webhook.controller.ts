import {
  BadRequestException,
  Controller,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from '../payments.service';
import { StripePaymentProvider } from '../providers/stripe.provider';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripeProvider: StripePaymentProvider,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  async handle(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!signature || !request.rawBody) {
      throw new BadRequestException(
        'Missing Stripe webhook signature or raw body.',
      );
    }

    const stripe = this.stripeProvider.getWebhookClient();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        signature,
        this.stripeProvider.getWebhookSecret(),
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;

      if (
        event.type === 'checkout.session.completed' &&
        session.payment_status !== 'paid'
      ) {
        return { received: true };
      }

      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        await this.paymentsService.confirmProviderPayment(
          paymentId,
          session.id,
        );
      }
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.paymentId;

      if (paymentId) {
        await this.paymentsService.failProviderPayment(
          paymentId,
          event.type === 'checkout.session.expired'
            ? 'STRIPE_SESSION_EXPIRED'
            : 'STRIPE_PAYMENT_FAILED',
          event.type === 'checkout.session.expired'
            ? 'Stripe Checkout session expired.'
            : 'Stripe reported an asynchronous payment failure.',
        );
      }
    }

    return { received: true };
  }
}
