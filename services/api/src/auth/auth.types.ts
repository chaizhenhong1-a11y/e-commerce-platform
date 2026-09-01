import type { UserRole } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  emailVerified: boolean;
  role: UserRole;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  type: 'access';
};
