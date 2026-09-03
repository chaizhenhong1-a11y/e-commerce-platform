import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { PaymentProvider, PaymentStatus } from '@prisma/client';
import { PaymentsService } from '../../src/payments/payments.service';

function paidShape(status: PaymentStatus = PaymentStatus.PENDING) {
  return {
    id: 'payment-1',
    orderId: 'order-1',
    provider: PaymentProvider.MANUAL_TEST,
    status,
    amountCents: 6000,
    currency: 'MYR',
    providerRef: 'manual-1',
    attempts: [
      {
        id: 'attempt-1',
        providerRef: 'manual-1',
      },
    ],
    order: {
      id: 'order-1',
      orderNumber: 'TS-ORDER-1',
      userId: 'user-1',
      status: 'AWAITING_PAYMENT',
      paymentStatus: 'PENDING',
      reservationExpiresAt: new Date(Date.now() + 60_000),
      items: [
        {
          variantId: 'variant-1',
          productName: 'Test product',
          quantity: 1,
        },
      ],
    },
  };
}

function createConfirmHarness(options?: {
  paymentStatus?: PaymentStatus;
  quantity?: number;
  reserved?: number;
  expired?: boolean;
}) {
  let inventoryWrites = 0;
  let paymentWrites = 0;
  let orderWrites = 0;
  let notificationWrites = 0;

  const payment = paidShape(options?.paymentStatus);
  if (options?.expired) {
    payment.order.reservationExpiresAt = new Date(Date.now() - 60_000);
  }

  const tx = {
    payment: {
      findUnique: async () => payment,
      update: async ({ data }: any) => {
        paymentWrites += 1;
        return { ...payment, ...data };
      },
      updateMany: async () => ({ count: 0 }),
    },
    paymentAttempt: {
      update: async () => ({}),
      updateMany: async () => ({ count: 0 }),
    },
    inventory: {
      findUnique: async () => ({
        id: 'inventory-1',
        variantId: 'variant-1',
        quantity: options?.quantity ?? 1,
        reserved: options?.reserved ?? 1,
      }),
      update: async () => {
        inventoryWrites += 1;
        return {};
      },
    },
    order: {
      update: async () => {
        orderWrites += 1;
        return {};
      },
    },
  };

  const prisma = {
    $transaction: async (callback: (client: any) => unknown) => callback(tx),
    payment: {
      findUnique: async () => ({
        ...payment,
        status:
          options?.paymentStatus === PaymentStatus.PAID
            ? PaymentStatus.PAID
            : paymentWrites > 0
              ? PaymentStatus.PAID
              : payment.status,
        order: payment.order,
      }),
    },
  };

  const service = new PaymentsService(
    prisma as any,
    {} as any,
    { get: () => 'test' } as any,
    {} as any,
    {
      create: async () => {
        notificationWrites += 1;
        return {};
      },
    } as any,
  );

  return {
    service,
    stats: () => ({
      inventoryWrites,
      paymentWrites,
      orderWrites,
      notificationWrites,
    }),
  };
}

describe('PaymentsService inventory settlement stability', () => {
  it('settles reserved inventory exactly once on successful payment', async () => {
    const harness = createConfirmHarness();

    const result = await harness.service.confirmProviderPayment(
      'payment-1',
      'manual-1',
    );

    assert.equal(result.status, PaymentStatus.PAID);
    assert.equal(harness.stats().inventoryWrites, 1);
    assert.equal(harness.stats().paymentWrites, 1);
    assert.equal(harness.stats().orderWrites, 1);
  });

  it('is idempotent when the same paid payment confirmation is delivered again', async () => {
    const harness = createConfirmHarness({
      paymentStatus: PaymentStatus.PAID,
    });

    const result = await harness.service.confirmProviderPayment(
      'payment-1',
      'manual-1',
    );

    assert.equal(result.status, PaymentStatus.PAID);
    assert.equal(harness.stats().inventoryWrites, 0);
    assert.equal(harness.stats().paymentWrites, 0);
    assert.equal(harness.stats().orderWrites, 0);
  });

  it('refuses payment after the inventory reservation expired', async () => {
    const harness = createConfirmHarness({ expired: true });

    await assert.rejects(
      () =>
        harness.service.confirmProviderPayment('payment-1', 'manual-1'),
      (error: unknown) =>
        error instanceof BadRequestException &&
        error.message === 'Order inventory reservation has expired.',
    );

    assert.equal(harness.stats().inventoryWrites, 0);
    assert.equal(harness.stats().paymentWrites, 0);
  });

  it('refuses settlement if reserved inventory is no longer sufficient', async () => {
    const harness = createConfirmHarness({ quantity: 1, reserved: 0 });

    await assert.rejects(
      () =>
        harness.service.confirmProviderPayment('payment-1', 'manual-1'),
      BadRequestException,
    );

    assert.equal(harness.stats().inventoryWrites, 0);
    assert.equal(harness.stats().paymentWrites, 0);
    assert.equal(harness.stats().orderWrites, 0);
  });
});
