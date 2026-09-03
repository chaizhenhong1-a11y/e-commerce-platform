import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { PaymentStatus, RefundStatus } from '@prisma/client';
import { RefundsService } from '../../src/payments/refunds/refunds.service';

function baseOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'TS-1001',
    userId: 'user-1',
    status: 'CONFIRMED',
    paymentStatus: PaymentStatus.PAID,
    totalCents: 6000,
    currency: 'MYR',
    subtotalCents: 5000,
    discountCents: 0,
    payments: [{
      id: 'payment-1',
      provider: 'STRIPE',
      providerRef: 'pi_1',
      status: PaymentStatus.PAID,
    }],
    refunds: [],
    ...overrides,
  };
}

function harness(options: {
  order?: any;
  providerState?: 'REFUNDED' | 'PROCESSING';
  providerError?: Error;
} = {}) {
  let creates = 0;
  const updates: any[] = [];
  const order = options.order ?? baseOrder();
  const refund = {
    id: 'refund-1',
    orderId: 'order-1',
    paymentId: 'payment-1',
    reason: 'CUSTOMER_REQUEST',
    customerNote: null,
    amountCents: 6000,
    currency: 'MYR',
    status: RefundStatus.REQUESTED,
  };

  const prisma = {
    order: { findUnique: async () => order },
    refund: {
      create: async () => { creates += 1; return refund; },
      update: async ({ data }: any) => {
        updates.push(data);
        return { ...refund, ...data };
      },
    },
  };
  const providers = {
    get: () => ({
      refund: async () => {
        if (options.providerError) throw options.providerError;
        return {
          state: options.providerState ?? 'PROCESSING',
          providerRef: 're_1',
        };
      },
    }),
  };
  const access = { assertCanAccess: () => undefined };
  const notifications = { create: async () => ({}) };

  return {
    service: new RefundsService(
      prisma as any,
      providers as any,
      access as any,
      notifications as any,
    ),
    stats: () => ({ creates, updates }),
  };
}

describe('RefundsService direct-refund stability', () => {
  it('rejects direct refunds after fulfillment so the return flow is used', async () => {
    const h = harness({ order: baseOrder({ status: 'FULFILLED' }) });
    await assert.rejects(
      () => h.service.request('TS-1001', 'CUSTOMER_REQUEST', undefined, 'user-1'),
      (error: unknown) =>
        error instanceof BadRequestException &&
        error.message.includes('return flow'),
    );
    assert.equal(h.stats().creates, 0);
  });

  it('rejects duplicate refund requests for the same order', async () => {
    const h = harness({
      order: baseOrder({ refunds: [{ id: 'existing-refund' }] }),
    });
    await assert.rejects(
      () => h.service.request('TS-1001', 'CUSTOMER_REQUEST', undefined, 'user-1'),
      BadRequestException,
    );
    assert.equal(h.stats().creates, 0);
  });

  it('rejects a paid order whose provider reference is missing', async () => {
    const h = harness({
      order: baseOrder({
        payments: [{
          id: 'payment-1',
          provider: 'STRIPE',
          providerRef: null,
          status: PaymentStatus.PAID,
        }],
      }),
    });
    await assert.rejects(
      () => h.service.request('TS-1001', 'CUSTOMER_REQUEST', undefined, 'user-1'),
      BadRequestException,
    );
    assert.equal(h.stats().creates, 0);
  });

  it('records provider failure as FAILED and rethrows the provider error', async () => {
    const h = harness({ providerError: new Error('refund provider unavailable') });

    await assert.rejects(
      () => h.service.request('TS-1001', 'CUSTOMER_REQUEST', '  note  ', 'user-1'),
      /refund provider unavailable/,
    );

    const failure = h.stats().updates.at(-1);
    assert.equal(failure.status, RefundStatus.FAILED);
    assert.equal(failure.failureCode, 'PROVIDER_REFUND_FAILED');
    assert.equal(failure.failureMessage, 'refund provider unavailable');
    assert.ok(failure.processedAt instanceof Date);
  });

  it('keeps an asynchronous provider refund in PROCESSING with its provider reference', async () => {
    const h = harness({ providerState: 'PROCESSING' });

    const result = await h.service.request(
      'TS-1001',
      'CUSTOMER_REQUEST',
      undefined,
      'user-1',
    );

    assert.equal(result.providerRef, 're_1');
    assert.equal(h.stats().creates, 1);
  });
});
