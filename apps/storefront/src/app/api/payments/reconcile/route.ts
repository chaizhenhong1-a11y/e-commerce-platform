import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies, callApiWithSession } from "@/features/account/server/auth-proxy";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const { upstream, refreshedTokens } = await callApiWithSession("/payments/reconcile", { method: "POST", body });
  if (!upstream) return NextResponse.json({ message: "Sign in to confirm an order payment." }, { status: 401 });
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(payload ?? { message: "Payment confirmation failed." }, { status: upstream.status });
  if (refreshedTokens) applyAuthCookies(response, refreshedTokens);
  return response;
}
