import { getProducts } from "@/features/catalog/data/catalog-api";
import { WishlistView } from "@/features/wishlist/components/wishlist-view";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const products = await getProducts();

  return (
    <section className="shell section-market wishlist-page">
      <WishlistView products={products} />
    </section>
  );
}
