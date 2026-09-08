import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";

async function proxy(request: NextRequest, method: "GET" | "PATCH") {
  const init: RequestInit =
    method === "PATCH"
      ? {
          method,
          headers: { "Content-Type": "application/json" },
          body: await request.text(),
        }
      : { method };

  const { upstream, refreshedTokens } = await callApiWithSession(
    "/staff/settings",
    init,
  );

  if (!upstream) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? {}, { status: upstream.status });

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  return response;
}

export async function GET(request: NextRequest) {
  return proxy(request, "GET");
}

export async function PATCH(request: NextRequest) {
  return proxy(request, "PATCH");
}
