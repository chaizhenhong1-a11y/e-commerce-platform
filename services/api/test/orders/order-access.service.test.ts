import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { NotFoundException } from '@nestjs/common';
import { OrderAccessService } from '../../src/orders/order-access.service';

function service() {
  return new OrderAccessService({
    getOrThrow: (key: string) => {
      assert.equal(key, 'ORDER_ACCESS_SECRET');
      return 'test-order-access-secret-that-is-long-enough';
    },
  } as any);
}

describe('OrderAccessService ownership isolation', () => {
  it('allows only the owning authenticated account to access an account order', () => {
    const access = service();
    const order = {
      id: 'order-1',
      orderNumber: 'TS-1001',
      userId: 'user-1',
    };

    assert.doesNotThrow(() => access.assertCanAccess(order, 'user-1'));
    assert.throws(
      () => access.assertCanAccess(order, 'user-2'),
      NotFoundException,
    );
    assert.throws(
      () => access.assertCanAccess(order),
      NotFoundException,
    );
  });

  it('does not issue guest tokens for account-owned orders', () => {
    const access = service();

    assert.equal(
      access.issueGuestToken({
        id: 'order-1',
        orderNumber: 'TS-1001',
        userId: 'user-1',
      }),
      null,
    );
  });

  it('issues a guest token that grants access only to the matching guest order', () => {
    const access = service();
    const order = {
      id: 'guest-order-1',
      orderNumber: 'TS-GUEST-1',
      userId: null,
    };
    const token = access.issueGuestToken(order);

    assert.ok(token);
    assert.doesNotThrow(() =>
      access.assertCanAccess(order, undefined, token ?? undefined),
    );

    assert.throws(
      () =>
        access.assertCanAccess(
          {
            ...order,
            id: 'guest-order-2',
          },
          undefined,
          token ?? undefined,
        ),
      NotFoundException,
    );
  });

  it('rejects missing or tampered guest-order tokens without revealing ownership', () => {
    const access = service();
    const order = {
      id: 'guest-order-1',
      orderNumber: 'TS-GUEST-1',
      userId: null,
    };
    const token = access.issueGuestToken(order);
    assert.ok(token);

    assert.throws(
      () => access.assertCanAccess(order),
      (error: unknown) =>
        error instanceof NotFoundException &&
        error.message === 'Order not found.',
    );

    assert.throws(
      () =>
        access.assertCanAccess(
          order,
          undefined,
          `${token}tampered`,
        ),
      NotFoundException,
    );
  });
});
