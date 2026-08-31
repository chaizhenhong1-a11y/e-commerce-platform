import { Injectable, NotImplementedException } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { ManualTestPaymentProvider } from './manual-test.provider';
import { PaymentProviderAdapter } from './payment-provider';
import { StripePaymentProvider } from './stripe.provider';

@Injectable()
export class PaymentProviderRegistry {
  private readonly providers: Map<
    PaymentProvider,
    PaymentProviderAdapter
  >;

  constructor(
    manualTestProvider: ManualTestPaymentProvider,
    stripeProvider: StripePaymentProvider,
  ) {
    this.providers = new Map<PaymentProvider, PaymentProviderAdapter>([
      [manualTestProvider.provider, manualTestProvider],
      [stripeProvider.provider, stripeProvider],
    ]);
  }

  get(provider: PaymentProvider): PaymentProviderAdapter {
    const adapter = this.providers.get(provider);

    if (!adapter) {
      throw new NotImplementedException(
        `${provider} payment adapter is not implemented yet.`,
      );
    }

    return adapter;
  }
}
