import { NextRequest, NextResponse } from "next/server";
import { directAuthRequest } from "@/features/account/server/auth-proxy";

export async function POST(request: NextRequest) {
  const upstream = await directAuthRequest(
    "/auth/password/forgot",
    await request.json(),
    request.headers.get("user-agent"),
  );
  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(
    payload ?? { accepted: true },
    { status: upstream.status },
  );
}
