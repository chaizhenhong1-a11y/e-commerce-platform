import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

async function proxy(method: "GET" | "POST", request?: NextRequest) {
  const body = request && method === "POST" ? await request.json().catch(() => undefined) : undefined;
  const { upstream, refreshedTokens } = await callApiWithSession("/staff/categories", {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}

export async function GET() { return proxy("GET"); }
export async function POST(request: NextRequest) { return proxy("POST", request); }
