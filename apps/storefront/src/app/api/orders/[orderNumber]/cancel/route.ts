import { NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";
import { getGuestOrderAccessToken } from "@/features/orders/server/order-access-cookie";

type RouteContext = {
  params: Promise<{ orderNumber: string }>;
};

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const { orderNumber } = await context.params;
  const guestToken = await getGuestOrderAccessToken(orderNumber);
  const headers = new Headers();

  if (guestToken) {
    headers.set("X-Order-Access-Token", guestToken);
  }

  const { upstream, refreshedTokens } =
    await callApiWithSession(
      `/orders/${encodeURIComponent(orderNumber)}/cancel`,
      {
        method: "POST",
        headers,
      },
      { allowGuest: true },
    );

  if (!upstream) {
    return NextResponse.json(
      { message: "Unable to reach order service." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(
    payload ?? { message: "Unable to cancel order." },
    { status: upstream.status },
  );

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  return response;
}
