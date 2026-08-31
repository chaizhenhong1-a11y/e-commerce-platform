import { NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
  clearAuthCookies,
} from "@/features/account/server/auth-proxy";

export async function GET() {
  const { upstream, refreshedTokens } =
    await callApiWithSession("/orders/me");

  if (!upstream) {
    return NextResponse.json(
      { message: "Not signed in." },
      { status: 401 },
    );
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(
    payload ?? { message: "Unable to load orders." },
    { status: upstream.status },
  );

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  if (upstream.status === 401) {
    clearAuthCookies(response);
  }

  return response;
}
