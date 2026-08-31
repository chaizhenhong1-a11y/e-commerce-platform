import { proxyAccountRequest } from "@/features/account/server/account-route";

type WishlistItemRouteProps = {
  params: Promise<{ productId: string }>;
};

export async function POST(
  _request: Request,
  { params }: WishlistItemRouteProps,
) {
  const { productId } = await params;
  return proxyAccountRequest(
    `/wishlist/${encodeURIComponent(productId)}`,
    { method: "POST" },
  );
}

export async function DELETE(
  _request: Request,
  { params }: WishlistItemRouteProps,
) {
  const { productId } = await params;
  return proxyAccountRequest(
    `/wishlist/${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
}
