import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const { upstream, refreshedTokens } = await callApiWithSession(
    "/coupons/validate",
    { method: "POST", body }
  );

  if (!upstream) {
    return NextResponse.json(
      { message: "Unable to validate coupon." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(
    payload ?? { message: "Unable to validate coupon." },
    { status: upstream.status },
  );
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
