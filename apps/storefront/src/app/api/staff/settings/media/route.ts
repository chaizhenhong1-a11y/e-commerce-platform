import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const { upstream, refreshedTokens } = await callApiWithSession("/staff/settings/media", { method: "POST", body: form });
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
