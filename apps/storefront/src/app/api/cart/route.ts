import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";

async function proxy(
  request: NextRequest,
  method: "GET" | "POST",
) {
  const sessionId =
    method === "GET"
      ? request.nextUrl.searchParams.get("sessionId")
      : ((await request.json().catch(() => null)) as
          | {
              sessionId?: string;
              variantId?: string;
              quantity?: number;
            }
          | null);

  const resolvedSessionId =
    typeof sessionId === "string" ? sessionId : sessionId?.sessionId;

  if (!resolvedSessionId) {
    return NextResponse.json(
      { message: "Cart session is required." },
      { status: 400 },
    );
  }

  const body =
    method === "POST" && typeof sessionId !== "string"
      ? JSON.stringify({
          variantId: sessionId?.variantId,
          quantity: sessionId?.quantity,
        })
      : undefined;

  const { upstream, refreshedTokens } =
    await callApiWithSession(
      `/cart/${encodeURIComponent(resolvedSessionId)}${
        method === "POST" ? "/items" : ""
      }`,
      {
        method,
        body,
      },
      { allowGuest: true },
    );

  if (!upstream) {
    return NextResponse.json(
      { message: "Unable to reach cart service." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(
    payload ?? { message: "Cart request failed." },
    { status: upstream.status },
  );

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  return response;
}

export function GET(request: NextRequest) {
  return proxy(request, "GET");
}

export function POST(request: NextRequest) {
  return proxy(request, "POST");
}
