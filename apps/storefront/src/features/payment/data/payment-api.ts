import type {
  Payment,
  PaymentProvider,
  PaymentReconciliation,
} from "../domain/payment";

async function request(
  path: string,
  init?: RequestInit,
): Promise<Payment> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string | string[] }
      | null;

    const message = Array.isArray(body?.message)
      ? body.message.join(" ")
      : body?.message;

    throw new Error(message || "Payment request failed.");
  }

  return response.json() as Promise<Payment>;
}

export function createPayment(
  orderNumber: string,
  provider: PaymentProvider,
) {
  return request("/api/payments", {
    method: "POST",
    body: JSON.stringify({
      orderNumber,
      provider,
    }),
  });
}

export function confirmDevelopmentPayment(
  paymentId: string,
  orderNumber: string,
) {
  return request(
    `/api/payments/${encodeURIComponent(paymentId)}/dev-confirm`,
    {
      method: "POST",
      body: JSON.stringify({ orderNumber }),
    },
  );
}

export async function reconcilePayment(orderNumber: string): Promise<PaymentReconciliation> {
  const response = await fetch("/api/payments/reconcile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(body?.message) ? body.message.join(" ") : body?.message;
    throw new Error(message || "Unable to confirm payment.");
  }
  return response.json() as Promise<PaymentReconciliation>;
}
