import { NextResponse } from "next/server";
import {
  applyAuthCookies,
  callApiWithSession,
} from "./auth-proxy";

export async function proxyAccountRequest(
  path: string,
  init?: RequestInit,
) {
  const { upstream, refreshedTokens } = await callApiWithSession(path, init);

  if (!upstream) {
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );
  }

  const body = await upstream.text();
  const response = new NextResponse(body || null, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    },
  });

  if (refreshedTokens) {
    applyAuthCookies(response, refreshedTokens);
  }

  return response;
}
