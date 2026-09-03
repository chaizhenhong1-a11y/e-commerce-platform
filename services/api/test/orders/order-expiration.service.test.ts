import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OrderExpirationService } from '../../src/orders/order-expiration.service';

function createHarness(options?: {
  reserved?: number;
  itemQuantity?: number;
  stillExpired?: boolean;
}) {
  let released = 0;
  let paymentFailures = 0;
  let attemptFailures = 0;
  let orderExpirations = 0;

  const order = {
    id: 'order-1',
    status: 'AWAITING_PAYMENT',
    paymentStatus: 'PENDING',
    reservationExpiresAt:
      options?.stillExpired === false
        ? new Date(Date.now() + 60_000)
        : new Date(Date.now() - 60_000),
    items: [
      {
        variantId: 'variant-1',
        quantity: options?.itemQuantity ?? 2,
      },
    ],
  };

  const tx = {
    order: {
      findUnique: async () => order,
      update: async () => {
        orderExpirations += 1;
        return {};
      },
    },
    inventory: {
      findUnique: async () => ({
        id: 'inventory-1',
        reserved: options?.reserved ?? 2,
      }),
      update: async ({ data }: any) => {
        released += data.reserved?.decrement ?? 0;
        return {};
      },
    },
    payment: {
      updateMany: async () => {
        paymentFailures += 1;
        return { count: 1 };
      },
    },
    paymentAttempt: {
      updateMany: async () => {
        attemptFailures += 1;
        return { count: 1 };
      },
    },
  };

  const prisma = {
    order: {
      findMany: async () => [{ id: 'order-1' }],
    },
    $transaction: async (callback: (client: any) => unknown) => callback(tx),
  };

  return {
    service: new OrderExpirationService(prisma as any),
    stats: () => ({
      released,
      paymentFailures,
      attemptFailures,
      orderExpirations,
    }),
  };
}

describe('OrderExpirationService reservation release stability', () => {
  it('releases the reserved quantity and expires unpaid orders', async () => {
    const harness = createHarness();

    await harness.service.expireUnpaidOrders();

    assert.deepEqual(harness.stats(), {
      released: 2,
      paymentFailures: 1,
      attemptFailures: 1,
      orderExpirations: 1,
    });
  });

  it('never decrements more reserved stock than currently exists', async () => {
    const harness = createHarness({ reserved: 1, itemQuantity: 3 });

    await harness.service.expireUnpaidOrders();

    assert.equal(harness.stats().released, 1);
    assert.equal(harness.stats().orderExpirations, 1);
  });

  it('does nothing if the order is no longer actually expired when locked', async () => {
    const harness = createHarness({ stillExpired: false });

    await harness.service.expireUnpaidOrders();

    assert.deepEqual(harness.stats(), {
      released: 0,
      paymentFailures: 0,
      attemptFailures: 0,
      orderExpirations: 0,
    });
  });
});
