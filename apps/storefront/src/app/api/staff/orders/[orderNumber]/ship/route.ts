import { NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";
export async function POST(request: Request, context: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { upstream, refreshedTokens } = await callApiWithSession(`/staff/orders/${encodeURIComponent(orderNumber)}/ship`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
