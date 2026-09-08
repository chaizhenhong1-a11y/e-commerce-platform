import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";
async function proxy(path: string, init?: RequestInit) {
  const { upstream, refreshedTokens } = await callApiWithSession(path, init);
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
export async function GET() { return proxy("/staff/settings/locations", { cache: "no-store" }); }
export async function POST(request: NextRequest) { return proxy("/staff/settings/locations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(await request.json()) }); }
