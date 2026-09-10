import Link from "next/link";
import type { CSSProperties } from "react";
import type { Product } from "../domain/product";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";

const swatches = ["#DDD7CB", "#C8C2B6", "#B9B2A4"];

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0];

  return (
    <article className="market-product-card">
      <div
        className="market-product-card__media"
        style={
          {
            "--product-accent": swatches[index % swatches.length],
          } as CSSProperties
        }
      >
        <Link
          className="market-product-card__media-link"
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
        >
          {product.badge ? (
            <span className="market-product-card__badge">{product.badge}</span>
          ) : null}

          {primaryImage ? (
            <img
              className="market-product-card__image"
              src={primaryImage.url}
              alt={primaryImage.altText}
            />
          ) : (
            <div className="product-placeholder" aria-hidden="true">
              <span>{product.category.slice(0, 1)}</span>
            </div>
          )}
        </Link>

        <WishlistButton
          productId={product.id}
          productName={product.name}
        />
      </div>

      <div className="market-product-card__body">
        <span className="market-product-card__category">{product.category}</span>
        <Link
          className="market-product-card__title"
          href={`/products/${product.slug}`}
        >
          {product.name}
        </Link>
        <p>{product.description}</p>
        <div className="market-product-card__bottom">
          <div>
            <strong>{product.variants.length > 1 ? "From " : ""}RM {product.price.toFixed(2)}</strong>
            <span className="product-stock">
              {product.inStock ? "Ready to ship" : "Out of stock"}
            </span>
          </div>
          <Link
            className="quick-shop"
            href={`/products/${product.slug}`}
            aria-label={`View ${product.name}`}
          >
            <span>View</span>
            <b aria-hidden="true">→</b>
          </Link>
        </div>
      </div>
    </article>
  );
}
