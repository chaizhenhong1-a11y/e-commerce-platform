import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { TransactionalEmailService } from '../../src/notifications/transactional-email.service';

type Delivery = {
  id: string;
  eventKey: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: Date | null;
  errorMessage?: string | null;
};

function createHarness(options?: { existing?: Delivery | null; mode?: string }) {
  let existing = options?.existing ?? null;
  let createCalls = 0;
  let updateCalls = 0;

  const prisma = {
    emailDelivery: {
      findUnique: async () => existing,
      create: async ({ data }: any) => {
        createCalls += 1;
        existing = { id: 'delivery-1', eventKey: data.eventKey, status: 'PENDING' };
        return existing;
      },
      update: async ({ data }: any) => {
        updateCalls += 1;
        existing = { ...(existing as Delivery), ...data } as Delivery;
        return existing;
      },
    },
  };

  const values: Record<string, unknown> = {
    EMAIL_DELIVERY_MODE: options?.mode ?? 'CONSOLE',
    STOREFRONT_URL: 'https://shop.example.test/',
  };
  const config = {
    get: <T>(key: string) => values[key] as T | undefined,
    getOrThrow: <T>(key: string) => {
      if (!(key in values)) throw new Error(`Missing ${key}`);
      return values[key] as T;
    },
  };

  const service = new TransactionalEmailService(prisma as any, config as any);
  return {
    service,
    stats: () => ({ createCalls, updateCalls, delivery: existing }),
  };
}

const input = {
  userId: 'user-1',
  eventKey: 'order:1001:shipped',
  to: 'buyer@example.test',
  firstName: 'Buyer',
  subject: 'Your order has shipped',
  message: 'Courier: Test Express',
  actionPath: '/orders/1001',
};

describe('TransactionalEmailService', () => {
  it('marks a console delivery as SENT without SMTP', async () => {
    const harness = createHarness();
    const result = await harness.service.deliver(input);

    assert.equal(result.status, 'SENT');
    assert.equal(harness.stats().createCalls, 1);
    assert.equal(harness.stats().updateCalls, 1);
    assert.ok(result.sentAt instanceof Date);
  });

  it('does not create or resend an already SENT event', async () => {
    const harness = createHarness({
      existing: { id: 'delivery-existing', eventKey: input.eventKey, status: 'SENT' },
    });
    const result = await harness.service.deliver(input);

    assert.equal(result.status, 'SENT');
    assert.equal(harness.stats().createCalls, 0);
    assert.equal(harness.stats().updateCalls, 0);
  });

  it('does not duplicate an event that is already PENDING', async () => {
    const harness = createHarness({
      existing: { id: 'delivery-existing', eventKey: input.eventKey, status: 'PENDING' },
    });
    const result = await harness.service.deliver(input);

    assert.equal(result.status, 'PENDING');
    assert.equal(harness.stats().createCalls, 0);
    assert.equal(harness.stats().updateCalls, 0);
  });

  it('records FAILED instead of throwing when SMTP configuration is unavailable', async () => {
    const harness = createHarness({ mode: 'SMTP' });
    const result = await harness.service.deliver(input);

    assert.equal(result.status, 'FAILED');
    assert.equal(harness.stats().createCalls, 1);
    assert.equal(harness.stats().updateCalls, 1);
    assert.match(result.errorMessage ?? '', /SMTP_HOST/);
  });
});
