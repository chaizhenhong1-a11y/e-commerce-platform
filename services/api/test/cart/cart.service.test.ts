import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from '../../src/cart/cart.service';

function createHarness(options?: {
  quantity?: number;
  reserved?: number;
  variantExists?: boolean;
  existingQuantity?: number;
}) {
  let writes = 0;
  const prisma = {
    productVariant: {
      findFirst: async () =>
        options?.variantExists === false
          ? null
          : {
              id: 'variant-1',
              productId: 'product-1',
              isActive: true,
              inventory: {
                quantity: options?.quantity ?? 5,
                reserved: options?.reserved ?? 0,
              },
            },
    },
    cart: {
      upsert: async () => ({ id: 'cart-1' }),
      findUniqueOrThrow: async () => ({ id: 'cart-1', items: [] }),
    },
    cartItem: {
      findUnique: async () =>
        options?.existingQuantity == null
          ? null
          : { id: 'item-1', quantity: options.existingQuantity },
      upsert: async () => {
        writes += 1;
        return { id: 'item-1' };
      },
    },
  };

  return {
    service: new CartService(prisma as any),
    writes: () => writes,
  };
}

describe('CartService inventory stability', () => {
  it('allows the final sellable unit when quantity minus reserved equals one', async () => {
    const harness = createHarness({ quantity: 4, reserved: 3 });
    await harness.service.addItem('session-1', 'variant-1', 1);
    assert.equal(harness.writes(), 1);
  });

  it('rejects a cart addition when reserved inventory leaves no sellable stock', async () => {
    const harness = createHarness({ quantity: 4, reserved: 4 });
    await assert.rejects(
      () => harness.service.addItem('session-1', 'variant-1', 1),
      (error: unknown) =>
        error instanceof BadRequestException &&
        error.message === 'Insufficient stock.',
    );
    assert.equal(harness.writes(), 0);
  });

  it('validates the combined quantity when the SKU is already in the cart', async () => {
    const harness = createHarness({
      quantity: 5,
      reserved: 1,
      existingQuantity: 3,
    });
    await assert.rejects(
      () => harness.service.addItem('session-1', 'variant-1', 2),
      BadRequestException,
    );
    assert.equal(harness.writes(), 0);
  });

  it('rejects an inactive or unavailable SKU before mutating the cart', async () => {
    const harness = createHarness({ variantExists: false });
    await assert.rejects(
      () => harness.service.addItem('session-1', 'variant-1', 1),
      NotFoundException,
    );
    assert.equal(harness.writes(), 0);
  });

  it('rejects invalid customer quantities before any inventory lookup or write', async () => {
    const harness = createHarness();
    await assert.rejects(
      () => harness.service.addItem('session-1', 'variant-1', 100),
      BadRequestException,
    );
    assert.equal(harness.writes(), 0);
  });
});
