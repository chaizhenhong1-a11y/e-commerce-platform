import { proxyAccountRequest } from "@/features/account/server/account-route";

export async function GET() {
  return proxyAccountRequest("/wishlist");
}
