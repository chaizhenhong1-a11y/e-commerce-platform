import type { Cart } from "../domain/cart";

type ApiCart = {
  id: string;
  sessionId: string;
  items: Array<{
    id: string;
    quantity: number;
    variant: {
      id: string;
      sku: string;
      name: string;
      priceCents: number;
      currency: string;
      isActive: boolean;
      product: {
        name: string;
        slug: string;
        status: string;
        images: Array<{
          url: string;
          variantId: string | null;
          isPrimary: boolean;
        }>;
      };
      inventory: {
        quantity: number;
        reserved: number;
      } | null;
    };
  }>;
};

function mapCart(cart: ApiCart): Cart {
  const items = cart.items.map((item) => {
    const availableStock = Math.max(
      0,
      (item.variant.inventory?.quantity ?? 0) -
        (item.variant.inventory?.reserved ?? 0),
    );
    const productActive = item.variant.product.status === "ACTIVE";
    const variantActive = item.variant.isActive;
    const issue = !productActive || !variantActive
      ? "No longer available"
      : availableStock <= 0
        ? "Out of stock"
        : item.quantity > availableStock
          ? `Only ${availableStock} left`
          : undefined;
    const images = item.variant.product.images;
    const image =
      images.find((candidate) => candidate.variantId === item.variant.id) ??
      images.find((candidate) => candidate.variantId == null && candidate.isPrimary) ??
      images.find((candidate) => candidate.variantId == null) ??
      images[0];

    return {
      id: item.id,
      variantId: item.variant.id,
      sku: item.variant.sku,
      productName: item.variant.product.name,
      variantName: item.variant.name,
      slug: item.variant.product.slug,
      imageUrl: image?.url,
      quantity: item.quantity,
      price: item.variant.priceCents / 100,
      currency: item.variant.currency,
      availableStock,
      productActive,
      variantActive,
      issue,
    };
  });

  return {
    id: cart.id,
    sessionId: cart.sessionId,
    items,
    subtotal: items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    ),
    totalQuantity: items.reduce(
      (total, item) => total + item.quantity,
      0,
    ),
    canCheckout: items.length > 0 && items.every((item) => !item.issue),
    issueCount: items.filter((item) => item.issue).length,
  };
}

async function request(
  path: string,
  init?: RequestInit,
): Promise<Cart> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(body?.message ?? "Cart request failed.");
  }

  return mapCart((await response.json()) as ApiCart);
}

export function getCart(sessionId: string) {
  return request(`/api/cart?sessionId=${encodeURIComponent(sessionId)}`);
}

export function addCartItem(
  sessionId: string,
  variantId: string,
  quantity = 1,
) {
  return request("/api/cart", {
    method: "POST",
    body: JSON.stringify({ sessionId, variantId, quantity }),
  });
}

export function updateCartItem(
  sessionId: string,
  itemId: string,
  quantity: number,
) {
  return request(`/api/cart/items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    body: JSON.stringify({ sessionId, quantity }),
  });
}

export function removeCartItem(
  sessionId: string,
  itemId: string,
) {
  return request(`/api/cart/items/${encodeURIComponent(itemId)}`, {
    method: "DELETE",
    body: JSON.stringify({ sessionId }),
  });
}
