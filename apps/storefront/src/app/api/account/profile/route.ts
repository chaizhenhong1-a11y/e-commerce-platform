import type { NextRequest } from "next/server";
import { proxyAccountRequest } from "@/features/account/server/account-route";

export async function PATCH(request: NextRequest) {
  return proxyAccountRequest("/customers/me/profile", {
    method: "PATCH",
    body: await request.text(),
  });
}
