import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return NextResponse.json({ message: "Product ID is required." }, { status: 400 });
  }
  formData.delete("productId");

  const { upstream, refreshedTokens } = await callApiWithSession(
    `/staff/catalog/products/${encodeURIComponent(productId)}/images/upload`,
    { method: "POST", body: formData },
  );

  if (!upstream) return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? {}, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
