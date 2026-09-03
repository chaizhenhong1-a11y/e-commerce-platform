import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthService } from '../../src/auth/auth.service';

const activeUser = {
  id: 'user-1',
  email: 'buyer@example.com',
  passwordHash: 'not-used',
  firstName: 'Buyer',
  lastName: null,
  status: UserStatus.ACTIVE,
  role: UserRole.CUSTOMER,
  emailVerifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createService(options?: {
  session?: any;
  user?: any;
  verifyPayload?: any;
  verifyError?: Error;
}) {
  const updates: any[] = [];
  const creates: any[] = [];

  const prisma = {
    authSession: {
      findUnique: async () => options?.session ?? null,
      update: (args: any) => {
        updates.push(args);
        return Promise.resolve({});
      },
      create: (args: any) => {
        creates.push(args);
        return Promise.resolve({});
      },
      updateMany: async () => ({ count: 1 }),
    },
    user: {
      findUnique: async () =>
        options && 'user' in options ? options.user : activeUser,
    },
    $transaction: async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
  };

  const jwt = {
    signAsync: async () => 'new-access-token',
    verifyAsync: async () => {
      if (options?.verifyError) throw options.verifyError;
      return options?.verifyPayload ?? {
        sub: 'user-1',
        email: activeUser.email,
        type: 'access',
      };
    },
  };

  const config = {
    get: (key: string) => {
      if (key === 'AUTH_JWT_SECRET') {
        return '12345678901234567890123456789012';
      }
      return undefined;
    },
  };

  return {
    service: new AuthService(
      prisma as any,
      jwt as any,
      config as any,
      {} as any,
    ),
    updates,
    creates,
  };
}

describe('AuthService refresh-session stability', () => {
  it('rejects an unknown refresh token', async () => {
    const { service } = createService();

    await assert.rejects(
      () => service.refresh('unknown-token'),
      (error: unknown) =>
        error instanceof UnauthorizedException &&
        error.message === 'Refresh session is invalid or expired.',
    );
  });

  it('rejects a revoked refresh session', async () => {
    const { service } = createService({
      session: {
        id: 'session-1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        userAgent: null,
        user: activeUser,
      },
    });

    await assert.rejects(
      () => service.refresh('revoked-token'),
      UnauthorizedException,
    );
  });

  it('rejects an expired refresh session', async () => {
    const { service } = createService({
      session: {
        id: 'session-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() - 1),
        userAgent: null,
        user: activeUser,
      },
    });

    await assert.rejects(
      () => service.refresh('expired-token'),
      UnauthorizedException,
    );
  });

  it('rejects refresh for a disabled account', async () => {
    const { service } = createService({
      session: {
        id: 'session-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        userAgent: null,
        user: {
          ...activeUser,
          status: UserStatus.DISABLED,
        },
      },
    });

    await assert.rejects(
      () => service.refresh('disabled-user-token'),
      UnauthorizedException,
    );
  });

  it('rotates a valid refresh session instead of reusing it', async () => {
    const { service, updates, creates } = createService({
      session: {
        id: 'session-1',
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        userAgent: 'old-agent',
        user: activeUser,
      },
    });

    const result = await service.refresh('valid-refresh-token', 'new-agent');

    assert.equal(result.accessToken, 'new-access-token');
    assert.equal(result.user.id, activeUser.id);
    assert.equal(result.user.role, UserRole.CUSTOMER);
    assert.notEqual(result.refreshToken, 'valid-refresh-token');
    assert.equal(result.expiresIn, 15 * 60);

    assert.equal(updates.length, 1);
    assert.equal(updates[0].where.id, 'session-1');
    assert.ok(updates[0].data.revokedAt instanceof Date);

    assert.equal(creates.length, 1);
    assert.equal(creates[0].data.userId, activeUser.id);
    assert.equal(creates[0].data.userAgent, 'new-agent');
    assert.ok(creates[0].data.expiresAt > new Date());
  });
});

describe('AuthService access-token stability', () => {
  it('rejects a token with the wrong token type', async () => {
    const { service } = createService({
      verifyPayload: {
        sub: 'user-1',
        email: activeUser.email,
        type: 'refresh',
      },
    });

    await assert.rejects(
      () => service.verifyAccessToken('wrong-type-token'),
      (error: unknown) =>
        error instanceof UnauthorizedException &&
        error.message === 'Access token is invalid.',
    );
  });

  it('normalizes JWT verification errors into UnauthorizedException', async () => {
    const { service } = createService({
      verifyError: new Error('jwt expired'),
    });

    await assert.rejects(
      () => service.verifyAccessToken('expired-token'),
      (error: unknown) =>
        error instanceof UnauthorizedException &&
        error.message === 'Access token is invalid or expired.',
    );
  });

  it('rejects an otherwise-valid token when the account no longer exists', async () => {
    const { service } = createService({ user: null });

    await assert.rejects(
      () => service.verifyAccessToken('valid-token'),
      (error: unknown) =>
        error instanceof UnauthorizedException &&
        error.message === 'Account is unavailable.',
    );
  });

  it('returns the current authoritative account identity for a valid token', async () => {
    const { service } = createService();

    const user = await service.verifyAccessToken('valid-token');

    assert.equal(user.id, activeUser.id);
    assert.equal(user.email, activeUser.email);
    assert.equal(user.role, UserRole.CUSTOMER);
    assert.equal(user.emailVerified, true);
  });
});
