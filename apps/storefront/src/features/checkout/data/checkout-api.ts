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

export async function validateCoupon(
  sessionId: string,
  couponCode: string,
): Promise<import("../domain/checkout").CouponValidation> {
  const response = await fetch("/api/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, couponCode }),
  });

  const body = (await response.json().catch(() => null)) as
    | import("../domain/checkout").CouponValidation
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const message = body && "message" in body ? body.message : undefined;
    throw new Error(Array.isArray(message) ? message.join(" ") : message || "Coupon could not be applied.");
  }

  return body as import("../domain/checkout").CouponValidation;
}

export async function previewAutomaticPromotion(
  sessionId: string,
): Promise<import("../domain/checkout").AutomaticPromotionPreview | null> {
  const response = await fetch("/api/promotions/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!response.ok) return null;
  const body = (await response.json().catch(() => null)) as
    | { automaticPromotion?: import("../domain/checkout").AutomaticPromotionPreview | null }
    | null;
  return body?.automaticPromotion ?? null;
}
