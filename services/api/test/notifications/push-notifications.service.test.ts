import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PushNotificationsService } from '../../src/notifications/push-notifications.service';

function createHarness(options?: {
  enabled?: boolean;
  existingStatus?: 'PENDING' | 'SENT' | 'FAILED' | null;
}) {
  let creates = 0;
  let updates = 0;
  let deviceQueries = 0;
  let delivery: any = options?.existingStatus
    ? {
        id: 'delivery-1',
        eventKey: 'order:TS1001:shipped',
        deviceId: 'device-1',
        status: options.existingStatus,
      }
    : null;

  const prisma = {
    pushDevice: {
      findMany: async () => {
        deviceQueries += 1;
        return [
          {
            id: 'device-1',
            token: 'token-1',
            userId: 'user-1',
          },
        ];
      },
    },
    pushDelivery: {
      findUnique: async () => delivery,
      create: async ({ data }: any) => {
        creates += 1;
        delivery = {
          id: 'delivery-1',
          ...data,
          status: 'PENDING',
        };
        return delivery;
      },
      update: async ({ data }: any) => {
        updates += 1;
        delivery = { ...delivery, ...data };
        return delivery;
      },
    },
  };

  const values: Record<string, unknown> = {
    PUSH_ENABLED: options?.enabled ?? true,
    PUSH_DELIVERY_MODE: 'CONSOLE',
  };
  const config = {
    get: <T>(key: string) => values[key] as T | undefined,
  };

  const service = new PushNotificationsService(prisma as any, config as any);
  return {
    service,
    stats: () => ({ creates, updates, deviceQueries, delivery }),
  };
}

const input = {
  userId: 'user-1',
  eventKey: 'order:TS1001:shipped',
  title: 'Your order has shipped',
  message: 'Courier: Test Express',
  actionPath: '/orders/TS1001',
  orderNumber: 'TS1001',
};

describe('PushNotificationsService', () => {
  it('does nothing when push delivery is disabled', async () => {
    const harness = createHarness({ enabled: false });
    await harness.service.deliver(input);

    assert.equal(harness.stats().deviceQueries, 0);
    assert.equal(harness.stats().creates, 0);
  });

  it('records a console delivery as SENT', async () => {
    const harness = createHarness();
    await harness.service.deliver(input);

    assert.equal(harness.stats().deviceQueries, 1);
    assert.equal(harness.stats().creates, 1);
    assert.equal(harness.stats().delivery.status, 'SENT');
    assert.ok(harness.stats().delivery.sentAt instanceof Date);
  });

  it('does not duplicate an already SENT device event', async () => {
    const harness = createHarness({ existingStatus: 'SENT' });
    await harness.service.deliver(input);

    assert.equal(harness.stats().creates, 0);
    assert.equal(harness.stats().updates, 0);
  });
});
