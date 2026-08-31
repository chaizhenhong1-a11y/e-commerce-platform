import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  directAuthRequest,
} from "@/features/account/server/auth-proxy";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const upstream = await directAuthRequest(
    "/auth/login",
    body,
    request.headers.get("user-agent"),
  );

  const payload = await upstream.json().catch(() => null);

  if (!upstream.ok) {
    return NextResponse.json(
      payload ?? { message: "Unable to sign in." },
      { status: upstream.status },
    );
  }

  const response = NextResponse.json(payload.user);
  applyAuthCookies(response, payload);
  return response;
}
