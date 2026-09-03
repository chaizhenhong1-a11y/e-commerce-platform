import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { OrdersService } from '../../src/orders/orders.service';

function createHarness(order: any) {
  const updates: any[] = [];
  const notifications: any[] = [];
  const prisma = {
    order: {
      findUnique: async () => order,
      update: async ({ data }: any) => {
        updates.push(data);
        return { ...order, ...data };
      },
    },
  };
  const access = { assertCanAccess: () => undefined };
  const notificationService = {
    create: async (input: any) => {
      notifications.push(input);
      return { id: 'notification-1' };
    },
  };
  return {
    service: new OrdersService(
      prisma as any,
      access as any,
      notificationService as any,
    ),
    updates,
    notifications,
  };
}

const paidOrder = {
  id: 'order-1',
  orderNumber: 'TS1001',
  userId: 'user-1',
  paymentStatus: PaymentStatus.PAID,
};

describe('OrdersService fulfillment transition stability', () => {
  it('moves a paid confirmed order into processing and emits one customer event', async () => {
    const harness = createHarness({ ...paidOrder, status: 'CONFIRMED' });
    const result = await harness.service.markProcessingForStaff('TS1001');
    assert.equal(result.status, 'PROCESSING');
    assert.equal(harness.updates.length, 1);
    assert.equal(harness.notifications.length, 1);
  });

  it('keeps processing idempotent when the order is already processing', async () => {
    const harness = createHarness({ ...paidOrder, status: 'PROCESSING' });
    const result = await harness.service.markProcessingForStaff('TS1001');
    assert.equal(result.status, 'PROCESSING');
    assert.equal(harness.updates.length, 0);
    assert.equal(harness.notifications.length, 0);
  });

  it('rejects shipping before processing', async () => {
    const harness = createHarness({ ...paidOrder, status: 'CONFIRMED' });
    await assert.rejects(
      () =>
        harness.service.shipForStaff('TS1001', {
          courierName: 'Test Express',
          trackingNumber: 'TRACK-1',
        }),
      BadRequestException,
    );
    assert.equal(harness.updates.length, 0);
  });

  it('rejects shipping an unpaid processing order', async () => {
    const harness = createHarness({
      ...paidOrder,
      status: 'PROCESSING',
      paymentStatus: PaymentStatus.PENDING,
    });
    await assert.rejects(
      () =>
        harness.service.shipForStaff('TS1001', {
          courierName: 'Test Express',
          trackingNumber: 'TRACK-1',
        }),
      BadRequestException,
    );
    assert.equal(harness.updates.length, 0);
  });

  it('requires valid courier, tracking number and tracking URL before shipping', async () => {
    const harness = createHarness({ ...paidOrder, status: 'PROCESSING' });
    await assert.rejects(
      () =>
        harness.service.shipForStaff('TS1001', {
          courierName: ' ',
          trackingNumber: 'TRACK-1',
        }),
      BadRequestException,
    );
    await assert.rejects(
      () =>
        harness.service.shipForStaff('TS1001', {
          courierName: 'Test Express',
          trackingNumber: 'TRACK-1',
          trackingUrl: 'ftp://invalid.test/TRACK-1',
        }),
      BadRequestException,
    );
    assert.equal(harness.updates.length, 0);
  });

  it('rejects delivery before shipment', async () => {
    const harness = createHarness({ ...paidOrder, status: 'PROCESSING' });
    await assert.rejects(
      () => harness.service.deliverForStaff('TS1001'),
      BadRequestException,
    );
    assert.equal(harness.updates.length, 0);
  });

  it('keeps delivery idempotent after the order is already delivered', async () => {
    const harness = createHarness({ ...paidOrder, status: 'DELIVERED' });
    const result = await harness.service.deliverForStaff('TS1001');
    assert.equal(result.status, 'DELIVERED');
    assert.equal(harness.updates.length, 0);
    assert.equal(harness.notifications.length, 0);
  });
});
