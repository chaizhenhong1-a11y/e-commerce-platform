import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthCookies,
  directAuthRequest,
} from "@/features/account/server/auth-proxy";

export async function POST(request: NextRequest) {
  const upstream = await directAuthRequest(
    "/auth/password/reset",
    await request.json(),
    request.headers.get("user-agent"),
  );
  const payload = await upstream.json().catch(() => null);
  const response = NextResponse.json(
    payload ?? { message: "Unable to reset password." },
    { status: upstream.status },
  );
  if (upstream.ok) clearAuthCookies(response);
  return response;
}
