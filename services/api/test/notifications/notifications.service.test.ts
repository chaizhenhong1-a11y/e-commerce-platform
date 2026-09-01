import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../../src/notifications/notifications.service';

function createHarness(options?: { userExists?: boolean }) {
  let notificationCreates = 0;
  const deliveries: any[] = [];
  const prisma = {
    user: {
      findUnique: async () =>
        options?.userExists === false
          ? null
          : { id: 'user-1', email: 'buyer@example.test', firstName: 'Buyer' },
    },
    notification: {
      create: async ({ data }: any) => {
        notificationCreates += 1;
        return { id: 'notification-1', ...data };
      },
    },
  };
  const email = {
    deliver: async (input: any) => {
      deliveries.push(input);
      return { id: 'delivery-1', status: 'SENT' };
    },
  };
  const push = { deliver: async (input: any) => { deliveries.push({ channel: 'push', ...input }); } };
  const service = new NotificationsService(prisma as any, email as any, push as any);
  return { service, stats: () => ({ notificationCreates, deliveries }) };
}

describe('NotificationsService.create', () => {
  it('does nothing for anonymous events', async () => {
    const harness = createHarness();
    const result = await harness.service.create({
      type: NotificationType.ORDER,
      title: 'Order update',
      message: 'Ignored anonymous event',
    });

    assert.equal(result, null);
    assert.equal(harness.stats().notificationCreates, 0);
    assert.equal(harness.stats().deliveries.length, 0);
  });

  it('does nothing when the account no longer exists', async () => {
    const harness = createHarness({ userExists: false });
    const result = await harness.service.create({
      userId: 'missing-user',
      type: NotificationType.ORDER,
      title: 'Order update',
      message: 'Missing account',
    });

    assert.equal(result, null);
    assert.equal(harness.stats().notificationCreates, 0);
  });

  it('creates an account notification and dispatches email with the same event key', async () => {
    const harness = createHarness();
    const result = await harness.service.create({
      userId: 'user-1',
      type: NotificationType.SHIPPING,
      title: 'Your order has shipped',
      message: 'Courier: Test Express',
      orderNumber: 'TS1001',
      actionPath: '/orders/TS1001',
      eventKey: 'order:TS1001:shipped',
    });

    await new Promise((resolve) => setImmediate(resolve));
    const stats = harness.stats();
    assert.equal(result?.id, 'notification-1');
    assert.equal(stats.notificationCreates, 1);
    assert.equal(stats.deliveries.length, 2);
    const emailDelivery = stats.deliveries.find((item) => item.channel !== 'push');
    const pushDelivery = stats.deliveries.find((item) => item.channel === 'push');
    assert.equal(emailDelivery.eventKey, 'order:TS1001:shipped');
    assert.equal(emailDelivery.to, 'buyer@example.test');
    assert.equal(emailDelivery.notificationId, 'notification-1');
    assert.equal(pushDelivery.eventKey, 'order:TS1001:shipped');
  });
});
