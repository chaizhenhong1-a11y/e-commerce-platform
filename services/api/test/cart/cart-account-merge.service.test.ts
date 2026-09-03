import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { CartService } from '../../src/cart/cart.service';

function createHarness(options?: {
  accountItems?: Array<{ variantId: string; quantity: number }>;
  guestItems?: Array<{
    variantId: string;
    quantity: number;
    quantityOnHand: number;
    reserved: number;
  }>;
}) {
  const upserts: any[] = [];
  let guestDeleted = 0;

  const accountCart = {
    id: 'account-cart',
    userId: 'user-1',
    sessionId: 'account:user-1:test',
    status: 'ACTIVE',
    items: options?.accountItems ?? [],
  };

  const guestCart = {
    id: 'guest-cart',
    userId: null,
    sessionId: 'guest-session',
    status: 'ACTIVE',
    order: null,
    items: (options?.guestItems ?? []).map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      variant: {
        inventory: {
          quantity: item.quantityOnHand,
          reserved: item.reserved,
        },
      },
    })),
  };

  const tx = {
    cart: {
      findUnique: async ({ where }: any) =>
        where.userId ? accountCart : guestCart,
      delete: async () => {
        guestDeleted += 1;
        return {};
      },
      update: async () => ({ id: 'guest-cart' }),
      create: async () => ({ id: 'new-cart' }),
    },
    cartItem: {
      upsert: async (args: any) => {
        upserts.push(args);
        return {};
      },
    },
  };

  const prisma = {
    $transaction: async (callback: (client: any) => unknown) =>
      callback(tx),
    cart: {
      findUniqueOrThrow: async ({ where }: any) => ({
        id: where.id,
        items: [],
      }),
    },
  };

  return {
    service: new CartService(prisma as any),
    upserts,
    stats: () => ({ guestDeleted }),
  };
}

describe('CartService account merge stability', () => {
  it('merges a guest cart into the signed-in account cart', async () => {
    const harness = createHarness({
      accountItems: [{ variantId: 'v1', quantity: 1 }],
      guestItems: [
        {
          variantId: 'v1',
          quantity: 2,
          quantityOnHand: 10,
          reserved: 0,
        },
        {
          variantId: 'v2',
          quantity: 1,
          quantityOnHand: 5,
          reserved: 0,
        },
      ],
    });

    await harness.service.getOrCreate('guest-session', 'user-1');

    assert.equal(harness.upserts.length, 2);
    assert.equal(
      harness.upserts[0].update.quantity,
      3,
    );
    assert.equal(
      harness.upserts[1].create.quantity,
      1,
    );
    assert.equal(harness.stats().guestDeleted, 1);
  });

  it('caps merged quantity at current sellable stock', async () => {
    const harness = createHarness({
      accountItems: [{ variantId: 'v1', quantity: 3 }],
      guestItems: [
        {
          variantId: 'v1',
          quantity: 5,
          quantityOnHand: 6,
          reserved: 2,
        },
      ],
    });

    await harness.service.getOrCreate('guest-session', 'user-1');

    assert.equal(harness.upserts.length, 1);
    assert.equal(harness.upserts[0].update.quantity, 4);
  });

  it('never merges more than the first-version cart limit of 99', async () => {
    const harness = createHarness({
      accountItems: [{ variantId: 'v1', quantity: 90 }],
      guestItems: [
        {
          variantId: 'v1',
          quantity: 30,
          quantityOnHand: 200,
          reserved: 0,
        },
      ],
    });

    await harness.service.getOrCreate('guest-session', 'user-1');

    assert.equal(harness.upserts[0].update.quantity, 99);
  });

  it('drops an unsellable guest line instead of creating a zero-quantity cart item', async () => {
    const harness = createHarness({
      guestItems: [
        {
          variantId: 'v1',
          quantity: 2,
          quantityOnHand: 2,
          reserved: 2,
        },
      ],
    });

    await harness.service.getOrCreate('guest-session', 'user-1');

    assert.equal(harness.upserts.length, 0);
    assert.equal(harness.stats().guestDeleted, 1);
  });

  it('rejects invalid cart session ids before any cart work begins', async () => {
    const harness = createHarness();

    await assert.rejects(
      () => harness.service.getOrCreate('', 'user-1'),
      BadRequestException,
    );

    await assert.rejects(
      () => harness.service.getOrCreate('x'.repeat(129), 'user-1'),
      BadRequestException,
    );
  });
});
