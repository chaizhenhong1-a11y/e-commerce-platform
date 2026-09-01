import { NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession, clearAuthCookies } from "@/features/account/server/auth-proxy";
export async function POST() {
  const { upstream, refreshedTokens } = await callApiWithSession("/notifications/read-all", { method: "POST" });
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null); const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens); if (upstream.status === 401) clearAuthCookies(response); return response;
}
