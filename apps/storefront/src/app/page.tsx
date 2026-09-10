import Link from "next/link";
import { CatalogControls } from "@/features/catalog/components/catalog-controls";
import { ProductCard } from "@/features/catalog/components/product-card";
import {
  type CatalogSort,
  getCategories,
  getProducts,
} from "@/features/catalog/data/catalog-api";

export const dynamic = "force-dynamic";


type HomePageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
  }>;
};

function catalogSort(value?: string): CatalogSort {
  if (
    value === "price-asc" ||
    value === "price-desc" ||
    value === "name"
  ) {
    return value;
  }

  return "newest";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const sort = catalogSort(params.sort);
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const inStock = params.inStock === "true";

  const [products, categories] = await Promise.all([
    getProducts({ query, category, sort, minPrice: Number.isFinite(minPrice) ? minPrice : undefined, maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined, inStock }),
    getCategories(),
  ]);

  return (
    <>
      <section className="shell hero-market">
        <div className="hero-market__main">
          <div className="hero-market__content">
            <span className="promo-pill">NEW SEASON · 2026</span>
            <h1>Fresh picks for everyday living.</h1>
            <p>
              Discover practical, well-designed products selected for modern
              routines, clean spaces, and effortless style.
            </p>
            <div className="hero-market__actions">
              <Link className="button button--primary" href="#shop">
                Shop new arrivals
              </Link>
              <Link className="button button--light" href="#shop">
                Browse products
              </Link>
            </div>
          </div>
          <div className="hero-market__visual" aria-hidden="true">
            <div className="hero-market__visual-copy">
              <span>CURATED FOR DAILY LIFE</span>
              <strong>Useful objects.<br />Quiet design.</strong>
              <small>Thoughtful essentials selected for home, work, and everyday routines.</small>
            </div>
            <div className="hero-market__visual-mark">NEW<br />EDIT</div>
          </div>
        </div>

        <div className="hero-market__side">
          <article className="promo-card promo-card--dark">
            <span>SHOP BY CATEGORY</span>
            <strong>Find the right essentials faster.</strong>
            <Link href="#shop">Browse the catalog →</Link>
          </article>
          <article className="promo-card promo-card--soft">
            <span>STORE INFORMATION</span>
            <strong>Delivery, returns, support, and store details.</strong>
            <Link href="/store/about">Visit our store →</Link>
          </article>
        </div>
      </section>

      <section className="trust-strip">
        <div className="shell trust-strip__grid">
          <div><strong>Real inventory</strong><span>Live availability from the catalog</span></div>
          <div><strong>Clear delivery</strong><span>Store delivery terms before purchase</span></div>
          <div><strong>Secure checkout</strong><span>Protected payment flow</span></div>
          <div><strong>Customer support</strong><span>Store contact and policy information</span></div>
        </div>
      </section>

      <section className="shell section-market section-market--catalog" id="shop">
        <div className="market-heading">
          <div>
            <span className="section-kicker">CATALOG</span>
            <h2>
              {query
                ? `Results for “${query}”`
                : category || "Shop all products"}
            </h2>
          </div>
          <span className="market-heading__meta">
            {products.length} {products.length === 1 ? "item" : "items"}
          </span>
        </div>

        <CatalogControls
          query={query}
          category={category}
          sort={sort}
          categories={categories}
          minPrice={Number.isFinite(minPrice) ? minPrice : undefined}
          maxPrice={Number.isFinite(maxPrice) ? maxPrice : undefined}
          inStock={inStock}
        />

        {products.length > 0 ? (
          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <strong>
              {query || category
                ? "No products match these filters."
                : "No products available yet."}
            </strong>
            <p>
              {query || category
                ? "Try another search term, category, or clear the filters."
                : "Products will appear here when the live catalog has active inventory."}
            </p>
            {query || category ? (
              <Link className="button" href="/#shop">
                Clear filters
              </Link>
            ) : null}
          </div>
        )}
      </section>

      <section className="shell campaign-grid">
        <article className="campaign-card campaign-card--large">
          <span className="section-kicker">DISCOVER THE CATALOG</span>
          <h2>Good products should be easy to find.</h2>
          <p>Use category, price, availability, and sorting controls to narrow the live catalog without the noise.</p>
          <Link className="button button--light" href="#shop">Explore products</Link>
        </article>

        <article className="campaign-card campaign-card--small">
          <span className="section-kicker">YOUR ACCOUNT</span>
          <h2>Orders and saved items, together.</h2>
          <Link href="/account">Open your account →</Link>
        </article>
      </section>

      <section className="shell reassurance" id="about">
        <div className="market-heading">
          <div>
            <span className="section-kicker">WHY SHOP HERE</span>
            <h2>Shopping without the noise.</h2>
          </div>
        </div>

        <div className="reassurance-grid">
          <article>
            <span>01</span>
            <h3>Clear product information</h3>
            <p>Pricing, variants, availability, and product details stay close to the buying decision.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Real stock</h3>
            <p>Availability is checked against backend inventory before cart updates.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Consistent shopping</h3>
            <p>Your catalog, inventory, orders, and customer account are backed by the same commerce system.</p>
          </article>
        </div>
      </section>
    </>
  );
}
