import { callApiWithSession } from "@/features/account/server/auth-proxy";
import { getGuestOrderAccessToken } from "@/features/orders/server/order-access-cookie";
import type { PublicOrderStatus } from "../domain/order-status";

export async function getOrderStatus(
  orderNumber: string,
): Promise<PublicOrderStatus> {
  const guestToken = await getGuestOrderAccessToken(orderNumber);
  const headers = new Headers();

  if (guestToken) {
    headers.set("X-Order-Access-Token", guestToken);
  }

  const { upstream } = await callApiWithSession(
    `/orders/${encodeURIComponent(orderNumber)}/status`,
    { headers },
    { allowGuest: true },
  );

  if (!upstream) {
    throw new Error("Unable to reach order service.");
  }

  if (!upstream.ok) {
    const body = (await upstream.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(body?.message || "Unable to load order status.");
  }

  return upstream.json() as Promise<PublicOrderStatus>;
}
