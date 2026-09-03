import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotificationType } from '@prisma/client';
import { NotificationsService } from '../../src/notifications/notifications.service';

function harness() {
  let creates = 0;
  let emailCalls = 0;
  let pushCalls = 0;
  const prisma = {
    user: {
      findUnique: async () => ({
        id: 'user-1',
        email: 'buyer@example.test',
        firstName: 'Buyer',
      }),
    },
    notification: {
      create: async ({ data }: any) => {
        creates += 1;
        return { id: 'notification-1', ...data };
      },
    },
  };
  const email = {
    deliver: async () => {
      emailCalls += 1;
      throw new Error('SMTP offline');
    },
  };
  const push = {
    deliver: async () => {
      pushCalls += 1;
      throw new Error('Push offline');
    },
  };
  return {
    service: new NotificationsService(prisma as any, email as any, push as any),
    stats: () => ({ creates, emailCalls, pushCalls }),
  };
}

describe('NotificationsService delivery failure isolation', () => {
  it('keeps the in-app notification when both external delivery channels fail', async () => {
    const h = harness();

    const result = await h.service.create({
      userId: 'user-1',
      type: NotificationType.ORDER,
      title: 'Order update',
      message: 'Your order changed.',
      eventKey: 'order:test:update',
    });

    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(result?.id, 'notification-1');
    assert.deepEqual(h.stats(), {
      creates: 1,
      emailCalls: 1,
      pushCalls: 1,
    });
  });
});
