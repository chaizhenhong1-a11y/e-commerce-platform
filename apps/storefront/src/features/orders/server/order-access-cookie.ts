import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ORDER_ACCESS_COOKIE = "textshop_order_access";
const ORDER_ACCESS_MAX_AGE = 30 * 24 * 60 * 60;
const MAX_STORED_ORDERS = 8;

type GuestOrderAccessEntry = {
  orderNumber: string;
  token: string;
  createdAt: number;
};

function decodeEntries(value?: string): GuestOrderAccessEntry[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (entry): entry is GuestOrderAccessEntry =>
        Boolean(
          entry &&
            typeof entry === "object" &&
            "orderNumber" in entry &&
            typeof entry.orderNumber === "string" &&
            "token" in entry &&
            typeof entry.token === "string" &&
            "createdAt" in entry &&
            typeof entry.createdAt === "number",
        ),
    );
  } catch {
    return [];
  }
}

function encodeEntries(entries: GuestOrderAccessEntry[]) {
  return Buffer.from(JSON.stringify(entries), "utf8").toString(
    "base64url",
  );
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORDER_ACCESS_MAX_AGE,
  };
}

export async function getGuestOrderAccessToken(
  orderNumber: string,
) {
  const store = await cookies();
  const entries = decodeEntries(
    store.get(ORDER_ACCESS_COOKIE)?.value,
  );

  return (
    entries.find((entry) => entry.orderNumber === orderNumber)
      ?.token ?? null
  );
}

export async function applyGuestOrderAccessCookie(
  response: NextResponse,
  orderNumber: string,
  token: string,
) {
  const store = await cookies();
  const existing = decodeEntries(
    store.get(ORDER_ACCESS_COOKIE)?.value,
  ).filter((entry) => entry.orderNumber !== orderNumber);

  const next = [
    {
      orderNumber,
      token,
      createdAt: Date.now(),
    },
    ...existing,
  ]
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, MAX_STORED_ORDERS);

  response.cookies.set(
    ORDER_ACCESS_COOKIE,
    encodeEntries(next),
    cookieOptions(),
  );
}
