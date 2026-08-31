import { NextResponse } from "next/server";
import {
  clearAuthCookies,
  directLogout,
  getRefreshCookie,
} from "@/features/account/server/auth-proxy";

export async function POST() {
  const refreshToken = await getRefreshCookie();

  if (refreshToken) {
    await directLogout(refreshToken).catch(() => null);
  }

  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
