import { NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

type RouteContext = { params: Promise<{ orderNumber: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { orderNumber } = await context.params;
  const { upstream, refreshedTokens } = await callApiWithSession(
    `/orders/${encodeURIComponent(orderNumber)}/cancel`,
    { method: "POST" },
  );
  if (!upstream) return NextResponse.json({ message: "Sign in to manage orders." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? { message: "Unable to cancel order." }, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
