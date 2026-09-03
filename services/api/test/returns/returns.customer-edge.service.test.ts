import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  PaymentStatus,
  ReturnStatus,
} from '@prisma/client';
import { ReturnsService } from '../../src/payments/returns/returns.service';

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: 'order-1',
    orderNumber: 'TS-1001',
    userId: 'user-1',
    status: 'DELIVERED',
    paymentStatus: PaymentStatus.PAID,
    items: [{
      id: 'order-item-1',
      productName: 'Tee',
      quantity: 2,
    }],
    returnRequests: [],
    ...overrides,
  };
}

function harness(orderValue: any) {
  let creates = 0;
  const prisma = {
    order: { findUnique: async () => orderValue },
    returnRequest: {
      create: async ({ data }: any) => {
        creates += 1;
        return { id: 'return-1', ...data };
      },
    },
  };
  return {
    service: new ReturnsService(prisma as any, {} as any),
    stats: () => ({ creates }),
  };
}

describe('ReturnsService customer-request edge stability', () => {
  it('requires authentication for fulfilled-order returns', async () => {
    const h = harness(order());
    await assert.rejects(
      () =>
        h.service.request(
          'TS-1001',
          'CHANGED_MIND',
          undefined,
          [{ orderItemId: 'order-item-1', quantity: 1 }],
        ),
      ForbiddenException,
    );
    assert.equal(h.stats().creates, 0);
  });

  it('rejects returns against another customer account', async () => {
    const h = harness(order());
    await assert.rejects(
      () =>
        h.service.request(
          'TS-1001',
          'CHANGED_MIND',
          undefined,
          [{ orderItemId: 'order-item-1', quantity: 1 }],
          'user-2',
        ),
      ForbiddenException,
    );
  });

  it('rejects duplicate order-item lines inside one return request', async () => {
    const h = harness(order());
    await assert.rejects(
      () =>
        h.service.request(
          'TS-1001',
          'CHANGED_MIND',
          undefined,
          [
            { orderItemId: 'order-item-1', quantity: 1 },
            { orderItemId: 'order-item-1', quantity: 1 },
          ],
          'user-1',
        ),
      BadRequestException,
    );
    assert.equal(h.stats().creates, 0);
  });

  it('rejects quantities above the remaining returnable amount', async () => {
    const h = harness(order({
      returnRequests: [{
        id: 'old-return',
        status: ReturnStatus.COMPLETED,
        items: [{ orderItemId: 'order-item-1', quantity: 1 }],
      }],
    }));

    await assert.rejects(
      () =>
        h.service.request(
          'TS-1001',
          'CHANGED_MIND',
          undefined,
          [{ orderItemId: 'order-item-1', quantity: 2 }],
          'user-1',
        ),
      (error: unknown) =>
        error instanceof BadRequestException &&
        error.message.includes('remaining returnable quantity'),
    );
  });

  it('blocks a second return while an active return already exists', async () => {
    const h = harness(order({
      returnRequests: [{
        id: 'active-return',
        status: ReturnStatus.APPROVED,
        items: [{ orderItemId: 'order-item-1', quantity: 1 }],
      }],
    }));

    await assert.rejects(
      () =>
        h.service.request(
          'TS-1001',
          'CHANGED_MIND',
          undefined,
          [{ orderItemId: 'order-item-1', quantity: 1 }],
          'user-1',
        ),
      BadRequestException,
    );
  });
});
