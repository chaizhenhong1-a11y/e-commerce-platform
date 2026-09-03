import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException } from '@nestjs/common';
import {
  ReturnDisposition,
  ReturnItemCondition,
  ReturnStatus,
} from '@prisma/client';
import { ReturnsService } from '../../src/payments/returns/returns.service';

function createHarness(request: any) {
  const updates: any[] = [];
  const itemUpdates: any[] = [];
  const prisma = {
    returnRequest: {
      findUnique: async () => request,
      update: async ({ data }: any) => {
        updates.push(data);
        return { ...request, ...data };
      },
    },
    returnItem: {
      update: async ({ where, data }: any) => {
        itemUpdates.push({ where, data });
        return { id: where.id, ...data };
      },
    },
    $transaction: async (input: any) =>
      Array.isArray(input) ? Promise.all(input) : input(prisma),
  };
  const refunds = { issueForReturn: async () => ({ id: 'refund-1', status: 'REFUNDED' }) };
  return {
    service: new ReturnsService(prisma as any, refunds as any),
    updates,
    itemUpdates,
  };
}

function request(status: ReturnStatus) {
  return {
    id: 'return-1',
    status,
    items: [
      { id: 'return-item-1', condition: null, disposition: null, inspectedAt: null },
      { id: 'return-item-2', condition: null, disposition: null, inspectedAt: null },
    ],
    order: { orderNumber: 'TS1001' },
    refund: null,
  };
}

describe('ReturnsService warehouse transition stability', () => {
  it('only approves returns that are awaiting review', async () => {
    const valid = createHarness(request(ReturnStatus.REQUESTED));
    const approved = await valid.service.approve('return-1', ' Approved ');
    assert.equal(approved.status, ReturnStatus.APPROVED);
    assert.equal(valid.updates[0].staffNote, 'Approved');

    const invalid = createHarness(request(ReturnStatus.RECEIVED));
    await assert.rejects(
      () => invalid.service.approve('return-1'),
      BadRequestException,
    );
    assert.equal(invalid.updates.length, 0);
  });

  it('only marks approved returns in transit', async () => {
    const harness = createHarness(request(ReturnStatus.REQUESTED));
    await assert.rejects(
      () => harness.service.markInTransit('return-1'),
      BadRequestException,
    );
    assert.equal(harness.updates.length, 0);
  });

  it('accepts receiving from approved or in-transit and rejects other states', async () => {
    for (const status of [ReturnStatus.APPROVED, ReturnStatus.IN_TRANSIT]) {
      const harness = createHarness(request(status));
      const received = await harness.service.receive('return-1');
      assert.equal(received.status, ReturnStatus.RECEIVED);
    }

    const invalid = createHarness(request(ReturnStatus.REQUESTED));
    await assert.rejects(
      () => invalid.service.receive('return-1'),
      BadRequestException,
    );
  });

  it('requires an inspection record for every returned line', async () => {
    const harness = createHarness(request(ReturnStatus.RECEIVED));
    await assert.rejects(
      () =>
        harness.service.inspect('return-1', [
          {
            returnItemId: 'return-item-1',
            condition: ReturnItemCondition.OPENED,
            disposition: ReturnDisposition.QUARANTINE,
          },
        ]),
      BadRequestException,
    );
    assert.equal(harness.itemUpdates.length, 0);
  });

  it('persists a complete inspection only after the return is received', async () => {
    const harness = createHarness(request(ReturnStatus.RECEIVED));
    await harness.service.inspect('return-1', [
      {
        returnItemId: 'return-item-1',
        condition: ReturnItemCondition.UNOPENED,
        disposition: ReturnDisposition.RESTOCK,
      },
      {
        returnItemId: 'return-item-2',
        condition: ReturnItemCondition.DAMAGED,
        disposition: ReturnDisposition.DISCARD,
      },
    ]);
    assert.equal(harness.itemUpdates.length, 2);
  });

  it('blocks completion until every returned line has been inspected', async () => {
    const harness = createHarness(request(ReturnStatus.RECEIVED));
    await assert.rejects(
      () => harness.service.complete('return-1'),
      BadRequestException,
    );
  });
});
