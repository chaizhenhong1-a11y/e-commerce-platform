import { NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession, clearAuthCookies } from "@/features/account/server/auth-proxy";
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { upstream, refreshedTokens } = await callApiWithSession(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null); const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens); if (upstream.status === 401) clearAuthCookies(response); return response;
}
