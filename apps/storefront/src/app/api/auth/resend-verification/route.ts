import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";

export async function POST(request: NextRequest) {
  const { upstream, refreshedTokens } = await callApiWithSession(
    "/auth/email/resend",
    {
      method: "POST",
      headers: { "User-Agent": request.headers.get("user-agent") ?? "" },
      body: "{}",
    },
  );
  if (!upstream) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(
    payload ?? { message: "Unable to resend verification email." },
    { status: upstream.status },
  );
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
