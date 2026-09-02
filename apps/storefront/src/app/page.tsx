import Link from "next/link";
import { CatalogControls } from "@/features/catalog/components/catalog-controls";
import { ProductCard } from "@/features/catalog/components/product-card";
import {
  type CatalogSort,
  getCategories,
  getProducts,
} from "@/features/catalog/data/catalog-api";

export const dynamic = "force-dynamic";

const categoryTiles = [
  { label: "Women", note: "New season", mark: "W" },
  { label: "Men", note: "Everyday edit", mark: "M" },
  { label: "Home", note: "Modern living", mark: "H" },
  { label: "Lifestyle", note: "Daily essentials", mark: "L" },
  { label: "Accessories", note: "Finishing touches", mark: "A" },
  { label: "Sale", note: "Limited offers", mark: "%" },
];

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
              <Link className="button button--light" href="#categories">
                Browse categories
              </Link>
            </div>
          </div>
          <div className="hero-market__visual" aria-hidden="true">
            <div className="hero-object hero-object--one">01</div>
            <div className="hero-object hero-object--two">02</div>
            <div className="hero-object hero-object--three">03</div>
            <span className="hero-market__caption">Curated essentials</span>
          </div>
        </div>

        <div className="hero-market__side">
          <article className="promo-card promo-card--dark">
            <span>MEMBER PRICE</span>
            <strong>Up to 20% off selected essentials</strong>
            <Link href="#shop">Shop the edit →</Link>
          </article>
          <article className="promo-card promo-card--soft">
            <span>WEEKEND DROP</span>
            <strong>Simple pieces. Better routines.</strong>
            <Link href="#shop">Discover more →</Link>
          </article>
        </div>
      </section>

      <section className="trust-strip">
        <div className="shell trust-strip__grid">
          <div><strong>Free shipping</strong><span>Orders RM150+</span></div>
          <div><strong>14-day returns</strong><span>Simple return process</span></div>
          <div><strong>Secure payments</strong><span>Protected checkout</span></div>
          <div><strong>Local support</strong><span>Help when you need it</span></div>
        </div>
      </section>

      <section className="shell section-market" id="categories">
        <div className="market-heading">
          <div>
            <span className="section-kicker">DISCOVER</span>
            <h2>Shop by category</h2>
          </div>
          <Link href="#shop">View all products →</Link>
        </div>

        <div className="category-grid">
          {categoryTiles.map((item) => (
            <Link
              className="category-tile"
              href={`/?category=${encodeURIComponent(item.label)}#shop`}
              key={item.label}
            >
              <div className="category-tile__art">{item.mark}</div>
              <div>
                <strong>{item.label}</strong>
                <span>{item.note}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="shell section-market" id="shop">
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
          <span className="section-kicker">HOME EDIT</span>
          <h2>Make everyday spaces feel considered.</h2>
          <p>Functional pieces with a quieter, cleaner point of view.</p>
          <Link className="button button--light" href="#shop">Shop home</Link>
        </article>

        <article className="campaign-card campaign-card--small">
          <span className="section-kicker">ESSENTIALS</span>
          <h2>Built for daily use.</h2>
          <Link href="#shop">Explore essentials →</Link>
        </article>
      </section>

      <section className="shell reassurance" id="about">
        <div className="market-heading">
          <div>
            <span className="section-kicker">WHY TEXTSHOP</span>
            <h2>Shopping without the noise.</h2>
          </div>
        </div>

        <div className="reassurance-grid">
          <article>
            <span>01</span>
            <h3>Clear prices</h3>
            <p>No hidden product pricing. What you see is what the store uses.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Real stock</h3>
            <p>Availability is checked against backend inventory before cart updates.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Reliable architecture</h3>
            <p>Web and mobile share the same trusted commerce backend.</p>
          </article>
        </div>
      </section>
    </>
  );
}
