export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  emailVerified: boolean;
};

export type AccessTokenPayload = {
  sub: string;
  email: string;
  type: 'access';
};
