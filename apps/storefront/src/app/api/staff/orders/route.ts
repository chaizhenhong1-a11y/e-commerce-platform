import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";
export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  for (const key of ["status", "paymentStatus", "q"]) { const value = request.nextUrl.searchParams.get(key); if (value) params.set(key, value); }
  const suffix = params.size ? `?${params.toString()}` : "";
  const { upstream, refreshedTokens } = await callApiWithSession(`/staff/orders${suffix}`);
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? [], { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
