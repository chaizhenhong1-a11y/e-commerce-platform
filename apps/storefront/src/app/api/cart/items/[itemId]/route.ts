import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";

type RouteContext = {
  params: Promise<{ itemId: string }>;
};

async function proxy(
  request: NextRequest,
  context: RouteContext,
  method: "PATCH" | "DELETE",
) {
  const { itemId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { sessionId?: string; quantity?: number }
    | null;

  if (!body?.sessionId) {
    return NextResponse.json(
      { message: "Cart session is required." },
      { status: 400 },
    );
  }

  const { upstream, refreshedTokens } =
    await callApiWithSession(
      `/cart/${encodeURIComponent(body.sessionId)}/items/${encodeURIComponent(
        itemId,
      )}`,
      {
        method,
        body:
          method === "PATCH"
            ? JSON.stringify({ quantity: body.quantity })
            : undefined,
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

export function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  return proxy(request, context, "PATCH");
}

export function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  return proxy(request, context, "DELETE");
}
