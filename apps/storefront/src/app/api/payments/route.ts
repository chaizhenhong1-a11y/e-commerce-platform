import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";
import { getGuestOrderAccessToken } from "@/features/orders/server/order-access-cookie";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { orderNumber?: string; provider?: string }
    | null;

  if (!body?.orderNumber || !body.provider) {
    return NextResponse.json(
      { message: "Order number and payment provider are required." },
      { status: 400 },
    );
  }

  const guestToken = await getGuestOrderAccessToken(
    body.orderNumber,
  );
  const headers = new Headers();

  if (guestToken) {
    headers.set("X-Order-Access-Token", guestToken);
  }

  const { upstream, refreshedTokens } =
    await callApiWithSession(
      "/payments",
      {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      },
      { allowGuest: true },
    );

  if (!upstream) {
    return NextResponse.json(
      { message: "Unable to reach payment service." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(
    payload ?? { message: "Payment request failed." },
    { status: upstream.status },
  );

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  return response;
}
