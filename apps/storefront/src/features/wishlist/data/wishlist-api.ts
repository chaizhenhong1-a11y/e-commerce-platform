export type WishlistSnapshot = {
  productIds: string[];
  items: Array<{
    productId: string;
    createdAt: string;
  }>;
};

async function readJson<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const body = (await response.json().catch(() => null)) as
    | T
    | { message?: string | string[] }
    | null;

  if (!response.ok) {
    const raw =
      body && typeof body === "object" && "message" in body
        ? body.message
        : undefined;
    const message = Array.isArray(raw) ? raw.join(" ") : raw;
    const error = new Error(message || fallbackMessage);
    Object.assign(error, { status: response.status });
    throw error;
  }

  return body as T;
}

export async function getWishlist() {
  const response = await fetch("/api/wishlist", {
    cache: "no-store",
  });

  return readJson<WishlistSnapshot>(
    response,
    "Unable to load wishlist.",
  );
}

export async function saveWishlistProduct(productId: string) {
  const response = await fetch(
    `/api/wishlist/${encodeURIComponent(productId)}`,
    { method: "POST" },
  );

  return readJson<{ productId: string; saved: true }>(
    response,
    "Unable to save product.",
  );
}

export async function removeWishlistProduct(productId: string) {
  const response = await fetch(
    `/api/wishlist/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );

  return readJson<{ productId: string; saved: false }>(
    response,
    "Unable to remove product.",
  );
}
