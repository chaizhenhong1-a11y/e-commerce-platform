import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";
import { getGuestOrderAccessToken } from "@/features/orders/server/order-access-cookie";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { orderNumber?: string }
    | null;
  const guestToken = body?.orderNumber
    ? await getGuestOrderAccessToken(body.orderNumber)
    : null;
  const headers = new Headers();

  if (guestToken) {
    headers.set("X-Order-Access-Token", guestToken);
  }

  const { upstream, refreshedTokens } =
    await callApiWithSession(
      `/payments/${encodeURIComponent(id)}/dev-confirm`,
      {
        method: "POST",
        headers,
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
