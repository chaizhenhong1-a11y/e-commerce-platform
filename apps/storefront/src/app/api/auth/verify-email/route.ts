import { NextRequest, NextResponse } from "next/server";
import { directAuthRequest } from "@/features/account/server/auth-proxy";

export async function POST(request: NextRequest) {
  const upstream = await directAuthRequest(
    "/auth/email/verify",
    await request.json(),
    request.headers.get("user-agent"),
  );
  const payload = await upstream.json().catch(() => null);
  return NextResponse.json(
    payload ?? { message: "Unable to verify email." },
    { status: upstream.status },
  );
}
