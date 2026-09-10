import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ACCESS_COOKIE = "elvane_access";
const REFRESH_COOKIE = "elvane_refresh";
const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

type TokenResponse = {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    emailVerified: boolean;
    role: "CUSTOMER" | "STAFF" | "ADMIN";
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

const refreshFlights = new Map<
  string,
  Promise<TokenResponse | null>
>();

async function refreshSession(
  refreshToken: string,
): Promise<TokenResponse | null> {
  const existing = refreshFlights.get(refreshToken);
  if (existing) {
    return existing;
  }

  const flight = (async () => {
    const response = await fetch(
      `${apiBaseUrl()}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TokenResponse;
  })();

  refreshFlights.set(refreshToken, flight);

  void flight.finally(() => {
    // Keep the completed flight briefly so near-simultaneous Next.js BFF
    // requests carrying the pre-rotation cookie can reuse the same tokens.
    setTimeout(() => {
      if (refreshFlights.get(refreshToken) === flight) {
        refreshFlights.delete(refreshToken);
      }
    }, 5_000);
  });

  return flight;
}

function apiBaseUrl() {
  return (
    process.env.ELVANE_API_BASE_URL ??
    process.env.NEXT_PUBLIC_ELVANE_API_BASE_URL ??
    "http://localhost:3001"
  ).replace(/\/$/, "");
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function callApiWithSession(
  path: string,
  init?: RequestInit,
  options: { allowGuest?: boolean } = {},
) {
  const store = await cookies();
  let accessToken = store.get(ACCESS_COOKIE)?.value;
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  let refreshedTokens: TokenResponse | null = null;

  async function call(token?: string) {
    const headers = new Headers(init?.headers);
    if (!headers.has("Content-Type") && typeof init?.body === "string") {
      headers.set("Content-Type", "application/json");
    }

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  }

  if (!accessToken && !refreshToken && !options.allowGuest) {
    return {
      upstream: null,
      refreshedTokens,
    };
  }

  let upstream = await call(accessToken);

  if (upstream.status === 401 && refreshToken) {
    refreshedTokens = await refreshSession(refreshToken);

    if (refreshedTokens) {
      accessToken = refreshedTokens.accessToken;
      upstream = await call(accessToken);
    }
  }

  if (
    upstream.status === 401 &&
    options.allowGuest
  ) {
    upstream = await call();
  }

  return {
    upstream,
    refreshedTokens,
  };
}

export function applyAuthCookies(
  response: NextResponse,
  tokens: TokenResponse,
) {
  response.cookies.set(
    ACCESS_COOKIE,
    tokens.accessToken,
    cookieOptions(ACCESS_MAX_AGE),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    tokens.refreshToken,
    cookieOptions(REFRESH_MAX_AGE),
  );
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", {
    ...cookieOptions(0),
    expires: new Date(0),
  });
  response.cookies.set(REFRESH_COOKIE, "", {
    ...cookieOptions(0),
    expires: new Date(0),
  });
}

export async function getRefreshCookie() {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

export async function directAuthRequest(
  path: "/auth/login" | "/auth/register" | "/auth/password/forgot" | "/auth/password/reset" | "/auth/email/verify",
  body: unknown,
  userAgent?: string | null,
) {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (userAgent) {
    headers.set("User-Agent", userAgent);
  }

  return fetch(`${apiBaseUrl()}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

export async function directLogout(refreshToken: string) {
  return fetch(`${apiBaseUrl()}/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
}
