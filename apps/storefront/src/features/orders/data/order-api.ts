import { callApiWithSession } from "@/features/account/server/auth-proxy";
import type { PublicOrderStatus } from "../domain/order-status";

export async function getOrderStatus(orderNumber: string): Promise<PublicOrderStatus> {
  const { upstream } = await callApiWithSession(`/orders/${encodeURIComponent(orderNumber)}/status`);
  if (!upstream) throw new Error("Sign in to view this order.");
  if (!upstream.ok) {
    const body = (await upstream.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message || "Unable to load order status.");
  }
  return upstream.json() as Promise<PublicOrderStatus>;
}
