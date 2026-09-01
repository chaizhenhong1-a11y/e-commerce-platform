import { NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

type RouteContext = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const { upstream, refreshedTokens } = await callApiWithSession(`/payments/${encodeURIComponent(id)}`);
  if (!upstream) return NextResponse.json({ message: "Sign in to view payment status." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? { message: "Payment request failed." }, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
