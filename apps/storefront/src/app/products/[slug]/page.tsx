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
          <div className="product-info-panel__eyebrow">
            <span className="product-brand">PRODUCT</span>
            <span className="product-category-label">{product.category}</span>
          </div>
          <div className="product-title-row">
            <h1>{product.name}</h1>
            <WishlistButton
              productId={product.id}
              productName={product.name}
              variant="detail"
            />
          </div>

          <p className="product-description">{product.description}</p>

          <div className="product-jump-links" aria-label="Product information">
            <a href="#details">Product details</a>
            <a href="#reviews">Customer reviews</a>
          </div>

          <VariantPurchasePanel variants={product.variants} colorSwatches={product.colorSwatches} />

          <div className="delivery-box">
            <div>
              <strong>Delivery information</strong>
              <span>Review current delivery terms and shipping information before checkout.</span>
              <Link href="/store/delivery">View delivery details →</Link>
            </div>
            <div>
              <strong>Returns information</strong>
              <span>Eligibility and return conditions follow the store&apos;s current return policy.</span>
              <Link href="/store/returns">View return policy →</Link>
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
          <h2>Product details</h2>
          <p className="product-details-section__intro">Product information maintained by the store.</p>
        </div>
        <div className="product-detail-copy">
          {product.description ? <p>{product.description}</p> : null}
          {product.details.highlights.length ? <div className="product-detail-group"><h3>Highlights</h3><ul>{product.details.highlights.map((highlight)=><li key={highlight}>{highlight}</li>)}</ul></div> : null}
          {product.details.material ? <div className="product-detail-group"><h3>Material</h3><p>{product.details.material}</p></div> : null}
          {product.details.dimensions ? <div className="product-detail-group"><h3>Dimensions / fit</h3><p>{product.details.dimensions}</p></div> : null}
          {product.details.care ? <div className="product-detail-group"><h3>Care</h3><p>{product.details.care}</p></div> : null}
          {Object.keys(product.details.specifications).length || product.variants[0]?.sku ? <div className="product-detail-group"><h3>Specifications</h3><dl className="product-specifications">{Object.entries(product.details.specifications).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}{product.variants.length ? <div><dt>{product.variants.length === 1 ? "SKU" : "SKUs"}</dt><dd>{product.variants.map((variant) => variant.sku).join(", ")}</dd></div> : null}</dl></div> : null}
        </div>
      </section>

      <ProductReviews productId={product.id} />
    </div>
  );
}
