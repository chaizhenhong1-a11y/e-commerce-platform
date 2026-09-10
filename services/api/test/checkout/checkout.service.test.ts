import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { CheckoutService } from '../../src/checkout/checkout.service';

const checkoutInput = {
  sessionId: 'session-1',
  email: 'buyer@example.com',
  fullName: 'Elvane Buyer',
  phone: '+60123456789',
  addressLine1: '1 Test Street',
  city: 'Kuala Lumpur',
  state: 'Kuala Lumpur',
  postcode: '50000',
  countryCode: 'MY' as const,
  shippingMethod: 'STANDARD' as const,
};

function cart(options?: {
  quantity?: number;
  reserved?: number;
  itemQuantity?: number;
  variantActive?: boolean;
  productStatus?: string;
  priceCents?: number;
  existingOrder?: { id: string } | null;
}) {
  return {
    id: 'cart-1',
    sessionId: 'session-1',
    userId: 'user-1',
    status: 'ACTIVE',
    order: options?.existingOrder ?? null,
    items: [
      {
        id: 'cart-item-1',
        quantity: options?.itemQuantity ?? 1,
        createdAt: new Date(),
        variant: {
          id: 'variant-1',
          sku: 'TS-ONE',
          name: 'Default',
          priceCents: options?.priceCents ?? 5000,
          isActive: options?.variantActive ?? true,
          product: {
            id: 'product-1',
            name: 'Test product',
            categoryId: null,
            status: options?.productStatus ?? 'ACTIVE',
          },
          inventory: {
            id: 'inventory-1',
            quantity: options?.quantity ?? 1,
            reserved: options?.reserved ?? 0,
          },
        },
      },
    ],
  };
}

function createHarness(cartValue: ReturnType<typeof cart>) {
  let reservedIncrement = 0;
  let orderCreates = 0;
  let converted = 0;
  let createdOrder: any;

  const tx = {
    cart: {
      findUnique: async () => cartValue,
      update: async () => {
        converted += 1;
        return {};
      },
    },
    inventory: {
      update: async ({ data }: any) => {
        reservedIncrement += data.reserved?.increment ?? 0;
        return {};
      },
    },
    order: {
      create: async ({ data }: any) => {
        orderCreates += 1;
        createdOrder = {
          id: 'order-1',
          orderNumber: 'TS-ORDER-1',
          status: 'AWAITING_PAYMENT',
          paymentStatus: 'PENDING',
          currency: data.currency,
          subtotalCents: data.subtotalCents,
          shippingCents: data.shippingCents,
          discountCents: data.discountCents,
          couponCode: data.couponCode,
          couponName: data.couponName,
          automaticPromotionName: data.automaticPromotionName,
          totalCents: data.totalCents,
          reservationExpiresAt: data.reservationExpiresAt,
          email: data.email,
          shippingName: data.shippingName,
          shippingPhone: data.shippingPhone,
          shippingLine1: data.shippingLine1,
          shippingLine2: data.shippingLine2,
          shippingCity: data.shippingCity,
          shippingState: data.shippingState,
          shippingPostcode: data.shippingPostcode,
          shippingCountryCode: data.shippingCountryCode,
          userId: 'user-1',
          items: data.items.create.map((item: any, index: number) => ({
            id: `order-item-${index + 1}`,
            ...item,
          })),
        };
        return createdOrder;
      },
      findUniqueOrThrow: async ({ where }: any) => {
        if (where.id === 'existing-order') {
          return {
            id: 'existing-order',
            orderNumber: 'TS-EXISTING',
            status: 'AWAITING_PAYMENT',
            paymentStatus: 'PENDING',
            currency: 'MYR',
            subtotalCents: 5000,
            shippingCents: 1000,
            discountCents: 0,
            couponCode: null,
            couponName: null,
            automaticPromotionName: null,
            totalCents: 6000,
            reservationExpiresAt: new Date(Date.now() + 60_000),
            email: 'buyer@example.com',
            shippingName: 'Buyer',
            shippingPhone: '+60123456789',
            shippingLine1: '1 Test Street',
            shippingLine2: null,
            shippingCity: 'KL',
            shippingState: 'KL',
            shippingPostcode: '50000',
            shippingCountryCode: 'MY',
            userId: 'user-1',
            items: [],
          };
        }
        return createdOrder;
      },
    },
    couponRedemption: { create: async () => ({}) },
  };

  const prisma = {
    $transaction: async (callback: (client: any) => unknown) => callback(tx),
  };
  const orderAccess = { issueGuestToken: () => null };
  const promotions = {
    evaluateBestAutomaticPromotion: async () => null,
    evaluateCoupon: async () => null,
    normalizeCode: (code: string) => code.trim().toUpperCase(),
  };

  return {
    service: new CheckoutService(
      prisma as any,
      orderAccess as any,
      promotions as any,
    ),
    stats: () => ({ reservedIncrement, orderCreates, converted }),
    tx,
    promotions,
  };
}

describe('CheckoutService reservation stability', () => {
  it('reserves the final available unit and snapshots the current price', async () => {
    const harness = createHarness(
      cart({ quantity: 4, reserved: 3, priceCents: 7250 }),
    );

    const result = await harness.service.createOrder(checkoutInput, 'user-1');

    assert.equal(harness.stats().reservedIncrement, 1);
    assert.equal(harness.stats().orderCreates, 1);
    assert.equal(harness.stats().converted, 1);
    assert.equal(result.items[0].unitPriceCents, 7250);
    assert.equal(result.subtotalCents, 7250);
  });

  it('rejects checkout when another reservation consumed the final unit', async () => {
    const harness = createHarness(cart({ quantity: 4, reserved: 4 }));

    await assert.rejects(
      () => harness.service.createOrder(checkoutInput, 'user-1'),
      (error: unknown) =>
        error instanceof BadRequestException &&
        error.message.includes('Only 0 unit(s)'),
    );

    assert.deepEqual(harness.stats(), {
      reservedIncrement: 0,
      orderCreates: 0,
      converted: 0,
    });
  });

  it('rejects a SKU that became inactive before checkout', async () => {
    const harness = createHarness(cart({ variantActive: false }));

    await assert.rejects(
      () => harness.service.createOrder(checkoutInput, 'user-1'),
      BadRequestException,
    );
    assert.equal(harness.stats().reservedIncrement, 0);
  });

  it('rejects a product that became unavailable before checkout', async () => {
    const harness = createHarness(cart({ productStatus: 'DRAFT' }));

    await assert.rejects(
      () => harness.service.createOrder(checkoutInput, 'user-1'),
      BadRequestException,
    );
    assert.equal(harness.stats().reservedIncrement, 0);
  });

  it('returns the existing order for a duplicate checkout of a converted cart', async () => {
    const harness = createHarness(
      cart({ existingOrder: { id: 'existing-order' } }),
    );

    const result = await harness.service.createOrder(checkoutInput, 'user-1');

    assert.equal(result.id, 'existing-order');
    assert.deepEqual(harness.stats(), {
      reservedIncrement: 0,
      orderCreates: 0,
      converted: 0,
    });
  });

  it('does not reserve inventory when coupon validation fails at checkout', async () => {
    const harness = createHarness(cart());
    harness.promotions.evaluateCoupon = async () => {
      throw new BadRequestException('Coupon has expired.');
    };

    await assert.rejects(
      () =>
        harness.service.createOrder(
          { ...checkoutInput, couponCode: 'EXPIRED' },
          'user-1',
        ),
      BadRequestException,
    );

    assert.equal(harness.stats().reservedIncrement, 0);
    assert.equal(harness.stats().orderCreates, 0);
  });
});
