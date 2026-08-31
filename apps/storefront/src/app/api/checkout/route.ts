import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";
import { applyGuestOrderAccessCookie } from "@/features/orders/server/order-access-cookie";

type CheckoutResponse = {
  orderNumber?: string;
  orderAccessToken?: string | null;
  [key: string]: unknown;
};

export async function POST(request: NextRequest) {
  const body = await request.text();
  const { upstream, refreshedTokens } =
    await callApiWithSession(
      "/checkout",
      {
        method: "POST",
        body,
      },
      { allowGuest: true },
    );

  if (!upstream) {
    return NextResponse.json(
      { message: "Unable to reach checkout." },
      { status: 503 },
    );
  }

  const payload = (await upstream.json().catch(() => null)) as
    | CheckoutResponse
    | null;
  const safePayload = payload ? { ...payload } : null;
  const orderAccessToken = safePayload?.orderAccessToken;
  const orderNumber = safePayload?.orderNumber;

  if (safePayload && "orderAccessToken" in safePayload) {
    delete safePayload.orderAccessToken;
  }

  const response = NextResponse.json(
    safePayload ?? { message: "Unable to complete checkout." },
    { status: upstream.status },
  );

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  if (
    upstream.ok &&
    typeof orderNumber === "string" &&
    typeof orderAccessToken === "string" &&
    orderAccessToken
  ) {
    await applyGuestOrderAccessCookie(
      response,
      orderNumber,
      orderAccessToken,
    );
  }

  return response;
}
