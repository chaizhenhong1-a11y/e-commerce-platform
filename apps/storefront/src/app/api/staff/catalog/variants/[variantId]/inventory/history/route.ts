import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await params;
  const { upstream, refreshedTokens } = await callApiWithSession(
    `/staff/catalog/variants/${encodeURIComponent(variantId)}/inventory/history`,
    { method: "GET" },
  );

  if (!upstream) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? [], { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
