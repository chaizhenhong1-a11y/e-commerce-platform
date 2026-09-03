import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../src/auth/guards/optional-jwt-auth.guard';
import { StaffAuthGuard } from '../../src/auth/guards/staff-auth.guard';

function contextFor(authorization?: string) {
  const request: {
    headers: { authorization?: string };
    user?: unknown;
  } = {
    headers: authorization ? { authorization } : {},
  };

  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any,
  };
}

describe('authentication guards', () => {
  it('rejects protected routes without a bearer token', async () => {
    const guard = new JwtAuthGuard({
      verifyAccessToken: async () => {
        throw new Error('should not be called');
      },
    } as any);
    const { context } = contextFor();

    await assert.rejects(
      () => guard.canActivate(context),
      (error: unknown) =>
        error instanceof UnauthorizedException &&
        error.message === 'Authentication is required.',
    );
  });

  it('rejects malformed Authorization headers', async () => {
    const guard = new JwtAuthGuard({
      verifyAccessToken: async () => {
        throw new Error('should not be called');
      },
    } as any);
    const { context } = contextFor('Basic abc');

    await assert.rejects(
      () => guard.canActivate(context),
      UnauthorizedException,
    );
  });

  it('attaches the authenticated user for a valid access token', async () => {
    const user = {
      id: 'user-1',
      email: 'buyer@example.com',
      firstName: 'Buyer',
      lastName: null,
      emailVerified: true,
      role: 'CUSTOMER',
    };
    const guard = new JwtAuthGuard({
      verifyAccessToken: async (token: string) => {
        assert.equal(token, 'valid-token');
        return user;
      },
    } as any);
    const { context, request } = contextFor('Bearer valid-token');

    assert.equal(await guard.canActivate(context), true);
    assert.equal(request.user, user);
  });

  it('propagates expired or invalid access-token failures', async () => {
    const guard = new JwtAuthGuard({
      verifyAccessToken: async () => {
        throw new UnauthorizedException(
          'Access token is invalid or expired.',
        );
      },
    } as any);
    const { context } = contextFor('Bearer expired-token');

    await assert.rejects(
      () => guard.canActivate(context),
      (error: unknown) =>
        error instanceof UnauthorizedException &&
        error.message === 'Access token is invalid or expired.',
    );
  });

  it('allows anonymous access through OptionalJwtAuthGuard when no token exists', async () => {
    let verifyCalls = 0;
    const guard = new OptionalJwtAuthGuard({
      verifyAccessToken: async () => {
        verifyCalls += 1;
        return {};
      },
    } as any);
    const { context, request } = contextFor();

    assert.equal(await guard.canActivate(context), true);
    assert.equal(verifyCalls, 0);
    assert.equal(request.user, undefined);
  });

  it('still validates a supplied bearer token on optional-auth routes', async () => {
    const guard = new OptionalJwtAuthGuard({
      verifyAccessToken: async () => {
        throw new UnauthorizedException('Access token is invalid or expired.');
      },
    } as any);
    const { context } = contextFor('Bearer bad-token');

    await assert.rejects(
      () => guard.canActivate(context),
      UnauthorizedException,
    );
  });
});

describe('staff authorization guard', () => {
  function staffHarness(role: string) {
    const { context, request } = contextFor('Bearer token');
    request.user = {
      id: 'user-1',
      email: 'user@example.com',
      firstName: 'User',
      lastName: null,
      emailVerified: true,
      role,
    };

    const guard = new StaffAuthGuard({
      canActivate: async () => true,
    } as any);

    return { guard, context };
  }

  it('rejects authenticated CUSTOMER accounts from Staff routes', async () => {
    const { guard, context } = staffHarness('CUSTOMER');

    await assert.rejects(
      () => guard.canActivate(context),
      (error: unknown) =>
        error instanceof ForbiddenException &&
        error.message === 'Staff access is required.',
    );
  });

  it('allows STAFF accounts', async () => {
    const { guard, context } = staffHarness('STAFF');
    assert.equal(await guard.canActivate(context), true);
  });

  it('allows ADMIN accounts', async () => {
    const { guard, context } = staffHarness('ADMIN');
    assert.equal(await guard.canActivate(context), true);
  });
});
