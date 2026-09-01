import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

async function proxy(categoryId: string, method: "PATCH" | "DELETE", request?: NextRequest) {
  const body = request && method === "PATCH" ? await request.json().catch(() => undefined) : undefined;
  const { upstream, refreshedTokens } = await callApiWithSession(
    `/staff/categories/${encodeURIComponent(categoryId)}`,
    {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  return proxy(categoryId, "PATCH", request);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  return proxy(categoryId, "DELETE");
}
