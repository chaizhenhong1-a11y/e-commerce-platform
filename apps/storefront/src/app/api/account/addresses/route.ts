import type { NextRequest } from "next/server";
import { proxyAccountRequest } from "@/features/account/server/account-route";

export async function GET() {
  return proxyAccountRequest("/customers/me/addresses");
}

export async function POST(request: NextRequest) {
  return proxyAccountRequest("/customers/me/addresses", {
    method: "POST",
    body: await request.text(),
  });
}
