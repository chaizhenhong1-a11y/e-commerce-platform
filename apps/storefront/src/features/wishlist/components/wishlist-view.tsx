"use client";

import Link from "next/link";
import { ProductCard } from "@/features/catalog/components/product-card";
import type { Product } from "@/features/catalog/domain/product";
import { useWishlist } from "@/features/wishlist/components/wishlist-provider";

export function WishlistView({ products }: { products: Product[] }) {
  const { productIds, loading, authenticated, refresh } = useWishlist();
  const savedProducts = products.filter((product) => productIds.has(product.id));

  if (loading) {
    return (
      <div className="wishlist-state-card">
        <strong>Loading your wishlist…</strong>
      </div>
    );
  }

  if (authenticated === false) {
    return (
      <div className="wishlist-state-card">
        <span className="section-kicker">YOUR WISHLIST</span>
        <h2>Sign in to see saved products.</h2>
        <p>
          Your account wishlist is synchronized through the same TextShop
          backend used by the mobile app.
        </p>
        <Link className="button button--primary" href="/account/sign-in">
          Sign in
        </Link>
      </div>
    );
  }

  if (savedProducts.length === 0) {
    return (
      <div className="wishlist-state-card">
        <span className="section-kicker">YOUR WISHLIST</span>
        <h2>Nothing saved yet.</h2>
        <p>
          Save products from the storefront or the TextShop mobile app and
          they will appear here under the same account.
        </p>
        <div className="wishlist-state-actions">
          <Link className="button button--primary" href="/#shop">
            Browse products
          </Link>
          <button className="button" type="button" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="market-heading wishlist-heading">
        <div>
          <span className="section-kicker">SAVED FOR LATER</span>
          <h1>Your wishlist</h1>
        </div>
        <span className="market-heading__meta">
          {savedProducts.length} {savedProducts.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="product-grid">
        {savedProducts.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </>
  );
}
