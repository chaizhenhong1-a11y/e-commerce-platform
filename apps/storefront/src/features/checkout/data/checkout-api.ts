import type {
  CheckoutOrder,
  CheckoutPayload,
} from "../domain/checkout";

export async function createCheckoutOrder(
  payload: CheckoutPayload,
): Promise<CheckoutOrder> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;

    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;

    throw new Error(message || "Unable to complete checkout.");
  }

  return response.json() as Promise<CheckoutOrder>;
}
