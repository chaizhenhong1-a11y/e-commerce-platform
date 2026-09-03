import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotImplementedException } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import { PaymentProviderRegistry } from '../../src/payments/providers/payment-provider.registry';

describe('PaymentProviderRegistry failure boundaries', () => {
  it('returns the registered provider adapters', () => {
    const manual = {
      provider: PaymentProvider.MANUAL_TEST,
    };
    const stripe = {
      provider: PaymentProvider.STRIPE,
    };
    const registry = new PaymentProviderRegistry(
      manual as any,
      stripe as any,
    );

    assert.equal(
      registry.get(PaymentProvider.MANUAL_TEST),
      manual,
    );
    assert.equal(
      registry.get(PaymentProvider.STRIPE),
      stripe,
    );
  });

  it('fails explicitly when an unknown provider has no adapter', () => {
    const registry = new PaymentProviderRegistry(
      { provider: PaymentProvider.MANUAL_TEST } as any,
      { provider: PaymentProvider.STRIPE } as any,
    );

    assert.throws(
      () => registry.get('UNSUPPORTED' as PaymentProvider),
      (error: unknown) =>
        error instanceof NotImplementedException &&
        error.message.includes('payment adapter is not implemented yet'),
    );
  });
});
