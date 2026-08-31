import { NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "@/features/account/server/auth-proxy";

type RouteContext = {
  params: Promise<{ reviewId: string }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const { reviewId } = await context.params;
  const { upstream, refreshedTokens } = await callApiWithSession(
    `/reviews/${encodeURIComponent(reviewId)}`,
    { method: "DELETE" },
  );

  if (!upstream) {
    return NextResponse.json(
      { message: "Sign in to manage this review." },
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
