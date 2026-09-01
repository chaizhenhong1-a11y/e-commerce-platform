import { NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

type RouteContext = { params: Promise<{ orderNumber: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { orderNumber } = await context.params;
  const body = await request.text();
  const { upstream, refreshedTokens } = await callApiWithSession(
    `/orders/${encodeURIComponent(orderNumber)}/refunds`,
    { method: "POST", body },
  );
  if (!upstream) return NextResponse.json({ message: "Sign in to request a refund." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? { message: "Unable to request refund." }, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
