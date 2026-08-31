import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/features/catalog/components/product-gallery";
import { ProductSelectionProvider } from "@/features/catalog/components/product-selection-provider";
import { VariantPurchasePanel } from "@/features/catalog/components/variant-purchase-panel";
import { getProductBySlug } from "@/features/catalog/data/catalog-api";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { ProductReviews } from "@/features/reviews/components/product-reviews";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {};
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }


  return (
    <div className="shell product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/#shop">{product.category}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <ProductSelectionProvider variants={product.variants}>
        <section className="product-market-layout">
        <ProductGallery
          images={product.images}
          category={product.category}
          productName={product.name}
        />

        <div className="product-info-panel">
          <span className="product-brand">TEXTSHOP SELECT</span>
          <div className="product-title-row">
            <h1>{product.name}</h1>
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="detail"
            />
          </div>

          <p className="product-description">{product.description}</p>

          <VariantPurchasePanel variants={product.variants} />

          <div className="delivery-box">
            <div>
              <strong>Free delivery over RM150</strong>
              <span>Estimated delivery: 2–5 working days</span>
            </div>
            <div>
              <strong>Easy 14-day returns</strong>
              <span>Return eligible items in original condition</span>
            </div>
          </div>

          <div className="product-assurance">
            <span>✓ Secure checkout</span>
            <span>✓ Real-time stock</span>
            <span>✓ Local support</span>
          </div>
        </div>
        </section>
      </ProductSelectionProvider>

      <section className="product-details-section" id="details">
        <div>
          <span className="section-kicker">DETAILS</span>
          <h2>Designed for everyday use.</h2>
        </div>
        <div className="product-detail-copy">
          <p>{product.description}</p>
          <ul>
            <li>Selected for practical everyday use</li>
            <li>Backed by live inventory availability</li>
            <li>Protected by TextShop&apos;s standard return policy</li>
          </ul>
        </div>
      </section>

      <ProductReviews productId={product.id} />
    </div>
  );
}
