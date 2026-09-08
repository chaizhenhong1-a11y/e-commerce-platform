import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";
async function proxy(id: string, init: RequestInit) {
  const { upstream, refreshedTokens } = await callApiWithSession(`/staff/settings/locations/${encodeURIComponent(id)}`, init);
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return proxy(id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(await request.json()) }); }
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return proxy(id, { method: "DELETE" }); }
