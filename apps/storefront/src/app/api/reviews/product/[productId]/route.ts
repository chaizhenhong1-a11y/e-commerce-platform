import { NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const { productId } = await context.params;
  const { upstream, refreshedTokens } = await callApiWithSession(
    `/reviews/product/${encodeURIComponent(productId)}`,
    undefined,
    { allowGuest: true },
  );

  if (!upstream) {
    return NextResponse.json(
      { message: "Unable to reach review service." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload, {
    status: upstream.status,
  });

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  return response;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const { productId } = await context.params;
  const body = await request.text();
  const { upstream, refreshedTokens } = await callApiWithSession(
    `/reviews/product/${encodeURIComponent(productId)}`,
    {
      method: "POST",
      body,
    },
  );

  if (!upstream) {
    return NextResponse.json(
      { message: "Sign in to review this product." },
      { status: 401 },
    );
  }

  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload, {
    status: upstream.status,
  });

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  return response;
}
