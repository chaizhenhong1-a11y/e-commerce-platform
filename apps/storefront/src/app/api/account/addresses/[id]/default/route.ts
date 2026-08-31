import type { NextRequest } from "next/server";
import { proxyAccountRequest } from "@/features/account/server/account-route";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  return proxyAccountRequest(
    `/customers/me/addresses/${encodeURIComponent(id)}/default`,
    { method: "POST" },
  );
}
