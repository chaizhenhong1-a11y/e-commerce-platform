import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  PaymentProvider,
  PaymentStatus,
} from '@prisma/client';
import { PaymentsService } from '../../src/payments/payments.service';

function pendingPayment(provider = PaymentProvider.STRIPE) {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    provider,
    status: PaymentStatus.PENDING,
    amountCents: 6000,
    currency: 'MYR',
    providerRef: 'provider-ref-1',
  };
}

function orderWithPayment(overrides?: Record<string, unknown>) {
  return {
    id: 'order-1',
    orderNumber: 'TS-1001',
    userId: 'user-1',
    email: 'buyer@example.com',
    status: 'AWAITING_PAYMENT',
    paymentStatus: 'PENDING',
    reservationExpiresAt: new Date(Date.now() + 60_000),
    totalCents: 6000,
    currency: 'MYR',
    payments: [pendingPayment()],
    ...overrides,
  };
}

function createHarness(options?: {
  order?: any;
  sessionState?: 'OPEN' | 'PAID' | 'PROCESSING' | 'EXPIRED';
  createSessionError?: Error;
  nodeEnv?: string;
}) {
  let paymentCreates = 0;
  let paymentUpdates = 0;
  let failedMarks = 0;
  let cancelCalls = 0;
  let resumeCalls = 0;

  const order = options?.order ?? orderWithPayment();
  const provider = {
    provider: PaymentProvider.STRIPE,
    resumeSession: async () => {
      resumeCalls += 1;
      return {
        state: options?.sessionState ?? 'OPEN',
        checkoutUrl: 'https://checkout.example/session',
      };
    },
    cancelSession: async () => {
      cancelCalls += 1;
    },
    createSession: async () => {
      if (options?.createSessionError) {
        throw options.createSessionError;
      }
      return {
        providerRef: 'new-provider-ref',
        checkoutUrl: 'https://checkout.example/new',
      };
    },
  };

  const manual = {
    provider: PaymentProvider.MANUAL_TEST,
    resumeSession: provider.resumeSession,
    cancelSession: provider.cancelSession,
    createSession: provider.createSession,
  };

  const providers = {
    get: (requested: PaymentProvider) =>
      requested === PaymentProvider.MANUAL_TEST ? manual : provider,
  };

  const prisma = {
    order: {
      findUnique: async () => order,
    },
    payment: {
      create: async () => {
        paymentCreates += 1;
        return {
          ...pendingPayment(
            order.payments?.[0]?.provider ?? PaymentProvider.STRIPE,
          ),
          providerRef: null,
          attempts: [
            {
              id: 'attempt-1',
            },
          ],
        };
      },
      update: async ({ data }: any) => {
        paymentUpdates += 1;
        return {
          ...pendingPayment(),
          providerRef: data.providerRef ?? null,
        };
      },
      findUnique: async () => null,
    },
    paymentAttempt: {
      update: async () => ({}),
    },
    $transaction: async (callback: (client: any) => unknown) => {
      failedMarks += 1;
      return callback({
        payment: {
          findUnique: async () => ({
            ...pendingPayment(),
            attempts: [],
          }),
          update: async ({ data }: any) => ({
            ...pendingPayment(),
            status: data.status,
          }),
        },
        paymentAttempt: {
          update: async () => ({}),
        },
      });
    },
  };

  const access = {
    assertCanAccess: () => undefined,
  };

  const config = {
    get: (key: string) =>
      key === 'NODE_ENV' ? options?.nodeEnv ?? 'test' : undefined,
  };

  return {
    service: new PaymentsService(
      prisma as any,
      providers as any,
      config as any,
      access as any,
      { create: async () => ({}) } as any,
    ),
    stats: () => ({
      paymentCreates,
      paymentUpdates,
      failedMarks,
      cancelCalls,
      resumeCalls,
    }),
  };
}

describe('PaymentsService payment recovery stability', () => {
  it('resumes an existing open session instead of creating a duplicate payment', async () => {
    const harness = createHarness();

    const result = await harness.service.create(
      'TS-1001',
      PaymentProvider.STRIPE,
      'user-1',
    );

    assert.equal('resumed' in result, true);
    if (!('resumed' in result)) {
      assert.fail('Expected an existing provider session to be resumed.');
    }
    assert.equal(result.resumed, true);
    assert.equal(
      result.checkoutUrl,
      'https://checkout.example/session',
    );
    assert.equal(harness.stats().resumeCalls, 1);
    assert.equal(harness.stats().paymentCreates, 0);
  });

  it('blocks a new payment while the provider still reports PROCESSING', async () => {
    const harness = createHarness({ sessionState: 'PROCESSING' });

    await assert.rejects(
      () =>
        harness.service.create(
          'TS-1001',
          PaymentProvider.STRIPE,
          'user-1',
        ),
      (error: unknown) =>
        error instanceof BadRequestException &&
        error.message.includes('still being processed'),
    );

    assert.equal(harness.stats().paymentCreates, 0);
  });

  it('marks an expired provider session failed before creating a replacement', async () => {
    const harness = createHarness({ sessionState: 'EXPIRED' });

    const result = await harness.service.create(
      'TS-1001',
      PaymentProvider.STRIPE,
      'user-1',
    );

    assert.equal('resumed' in result, true);
    if (!('resumed' in result)) {
      assert.fail('Expected a replacement provider session response.');
    }
    assert.equal(result.resumed, false);
    assert.equal(harness.stats().failedMarks, 1);
    assert.equal(harness.stats().paymentCreates, 1);
    assert.equal(harness.stats().paymentUpdates, 1);
  });

  it('marks a newly-created payment failed if provider session creation throws', async () => {
    const harness = createHarness({
      order: orderWithPayment({ payments: [] }),
      createSessionError: new Error('provider unavailable'),
    });

    await assert.rejects(
      () =>
        harness.service.create(
          'TS-1001',
          PaymentProvider.STRIPE,
          'user-1',
        ),
      /provider unavailable/,
    );

    assert.equal(harness.stats().paymentCreates, 1);
    assert.equal(harness.stats().failedMarks, 1);
  });

  it('refuses MANUAL_TEST payments in production', async () => {
    const harness = createHarness({
      order: orderWithPayment({ payments: [] }),
      nodeEnv: 'production',
    });

    await assert.rejects(
      () =>
        harness.service.create(
          'TS-1001',
          PaymentProvider.MANUAL_TEST,
          'user-1',
        ),
      ForbiddenException,
    );

    assert.equal(harness.stats().paymentCreates, 0);
  });
});
