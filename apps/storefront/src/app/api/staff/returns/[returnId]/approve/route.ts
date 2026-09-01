import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ returnId: string }> },
) {
  const { returnId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const { upstream, refreshedTokens } = await callApiWithSession(
    `/staff/returns/${encodeURIComponent(returnId)}/approve`,
    { method: "POST", body: JSON.stringify(body) },
  );

  if (!upstream) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(
    payload ?? { message: "Return action failed." },
    { status: upstream.status },
  );
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
